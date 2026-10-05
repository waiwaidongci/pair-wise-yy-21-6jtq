import fs from "fs";
import path from "path";

export type EntityRow = Record<string, any>;

export type CollectionName =
  | "gridAsset"
  | "faultReport"
  | "repairTicket"
  | "crew"
  | "sparePartUsage"
  | "ticketRestore";

export type StoreShape = Record<CollectionName, EntityRow[]>;

export interface UpdateOptions {
  expectedVersion?: number;
}

/**
 * Thrown when an optimistic-lock compare-and-swap fails: the row's current
 * version does not match the version the caller based its decision on.
 */
export class VersionConflictError extends Error {
  constructor(
    public readonly collection: string,
    public readonly id: number | string,
    public readonly currentVersion: number,
    public readonly currentRow: EntityRow
  ) {
    super(`version conflict on ${collection}#${id}: current version is ${currentVersion}`);
    this.name = "VersionConflictError";
  }
}

/**
 * Thrown when a transaction cannot be applied and was rolled back to the
 * last confirmed (committed) state.
 */
export class TransactionRollbackError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "TransactionRollbackError";
  }
}

/**
 * A file-backed persistent store.
 *
 * - All committed state lives in memory and is durably written to a single
 *   JSON file after every mutation (atomic write: tmp file + rename).
 * - Mutations are wrapped in {@link transact}: the callback works on a deep
 *   clone of the last committed state; the clone is only swapped in and
 *   persisted if the callback succeeds. On failure the previous committed
 *   state is restored, so callers can retry from the last confirmed state.
 * - Row-level optimistic concurrency is provided by an integer `version`
 *   column and compare-and-swap in {@link update}.
 *
 * This gives us: persistence across restarts, atomic multi-entity updates,
 * idempotency records, and first-writer-wins conflict detection.
 */
export class JsonStore {
  private readonly filePath: string;
  private data: StoreShape;
  private persistFailures = 0;

  constructor(filePath: string, seed: StoreShape) {
    this.filePath = filePath;
    this.data = this.load(seed);
  }

  private load(seed: StoreShape): StoreShape {
    const base = this.clone(seed);
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw) as Partial<StoreShape>;
        for (const key of Object.keys(base) as CollectionName[]) {
          if (Array.isArray(parsed[key])) {
            base[key] = parsed[key] as EntityRow[];
          }
        }
      }
    } catch (err) {
      console.warn("[store] load failed, seeding fresh:", (err as Error).message);
    }
    return base;
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  all(collection: CollectionName): EntityRow[] {
    return this.data[collection];
  }

  findById(collection: CollectionName, id: number | string): EntityRow | undefined {
    return this.data[collection].find((row) => String(row.id) === String(id));
  }

  /** Committed insert. Persists immediately. */
  insert(collection: CollectionName, row: EntityRow): EntityRow {
    const table = this.data[collection];
    const id =
      row.id ?? (table.length ? Math.max(...table.map((r) => Number(r.id) || 0)) + 1 : 1);
    const toInsert = { ...row, id };
    table.push(toInsert);
    this.persist();
    return toInsert;
  }

  /**
   * Committed update with optional optimistic compare-and-swap.
   * When `expectedVersion` is provided and the row's version differs,
   * a {@link VersionConflictError} is thrown before any write.
   */
  update(
    collection: CollectionName,
    id: number | string,
    patch: EntityRow,
    options: UpdateOptions = {}
  ): EntityRow {
    const table = this.data[collection];
    const idx = table.findIndex((row) => String(row.id) === String(id));
    if (idx === -1) {
      throw new Error(`${collection}#${id} not found`);
    }
    const current = table[idx];
    if (options.expectedVersion !== undefined && Number(current.version) !== options.expectedVersion) {
      throw new VersionConflictError(
        collection,
        id,
        Number(current.version) || 0,
        this.clone(current)
      );
    }
    const next: EntityRow = { ...current, ...patch, id: current.id };
    if (patch.version === undefined && current.version !== undefined) {
      next.version = Number(current.version) + 1;
    }
    table[idx] = next;
    this.persist();
    return next;
  }

  /**
   * Run `fn` against a transactional view of the store.
   *
   * The callback receives a {@link StoreTx} bound to a clone of the last
   * committed state. All reads and writes inside the callback operate on
   * that clone. Only after the callback returns successfully is the clone
   * swapped in and persisted (once). If the callback throws or persistence
   * fails, the previous committed state is kept and a
   * {@link TransactionRollbackError} is raised — the caller can then retry
   * from the last confirmed state.
   */
  transact<T>(fn: (tx: StoreTx) => T): T {
    const draft = this.clone(this.data);
    const tx: StoreTx = {
      all: (collection) => draft[collection],
      findById: (collection, id) =>
        draft[collection].find((row) => String(row.id) === String(id)),
      insert: (collection, row) => {
        const table = draft[collection];
        const newId =
          row.id ?? (table.length ? Math.max(...table.map((r) => Number(r.id) || 0)) + 1 : 1);
        const toInsert = { ...row, id: newId };
        table.push(toInsert);
        return toInsert;
      },
      update: (collection, id, patch, options = {}) => {
        const table = draft[collection];
        const idx = table.findIndex((row) => String(row.id) === String(id));
        if (idx === -1) {
          throw new Error(`${collection}#${id} not found`);
        }
        const current = table[idx];
        if (
          options.expectedVersion !== undefined &&
          Number(current.version) !== options.expectedVersion
        ) {
          throw new VersionConflictError(
            collection,
            id,
            Number(current.version) || 0,
            this.clone(current)
          );
        }
        const next: EntityRow = { ...current, ...patch, id: current.id };
        if (patch.version === undefined && current.version !== undefined) {
          next.version = Number(current.version) + 1;
        }
        table[idx] = next;
        return next;
      },
    };

    const committed = this.data;
    let result: T;
    try {
      result = fn(tx);
    } catch (err) {
      // Business / optimistic-lock conflict: roll back to last confirmed state
      // and re-throw the original error so callers can distinguish it.
      this.data = committed;
      throw err;
    }
    // Callback succeeded: commit by swapping in the draft and persisting once.
    this.data = draft;
    try {
      this.persist();
    } catch (persistErr) {
      // Persistence failed: roll back to the last confirmed state.
      this.data = committed;
      throw new TransactionRollbackError(
        `transaction rolled back: persist failed — ${(persistErr as Error).message}`,
        persistErr
      );
    }
    return result;
  }

  /** Test hook: make the next `times` persistence attempts fail. */
  __armPersistFailures(times: number): void {
    this.persistFailures = times;
  }

  private persist(): void {
    if (this.persistFailures > 0) {
      this.persistFailures -= 1;
      throw new Error("simulated persist failure");
    }
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.filePath);
  }
}

/** A transactional view over a {@link JsonStore}; writes are not persisted until commit. */
export interface StoreTx {
  all(collection: CollectionName): EntityRow[];
  findById(collection: CollectionName, id: number | string): EntityRow | undefined;
  insert(collection: CollectionName, row: EntityRow): EntityRow;
  update(
    collection: CollectionName,
    id: number | string,
    patch: EntityRow,
    options?: UpdateOptions
  ): EntityRow;
}
