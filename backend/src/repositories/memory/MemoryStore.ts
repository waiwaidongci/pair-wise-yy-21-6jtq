import type { Database } from "../ports/Database";
import type { Ctx } from "../ports/RepoContext";
import type { GridAsset } from "../../models/GridAsset";
import type { FaultReport } from "../../models/FaultReport";
import type { RepairTicket } from "../../models/RepairTicket";
import type { Crew } from "../../models/Crew";
import type { SparePartUsage } from "../../models/SparePartUsage";
import type { RestoreConfirmation } from "../../models/RestoreConfirmation";
import type { AuditLogEntry } from "../../models/AuditLogEntry";

export interface MemoryTables {
  gridAsset: GridAsset[];
  faultReport: FaultReport[];
  repairTicket: RepairTicket[];
  crew: Crew[];
  sparePartUsage: SparePartUsage[];
  restoreConfirmation: RestoreConfirmation[];
  auditLog: AuditLogEntry[];
}

type TableName = keyof MemoryTables;

/** 事务期间的工作视图：仓储直接在 tables 上读写，提交时整体替换 */
export interface MemoryView {
  readonly kind: "memory";
  tables: MemoryTables;
}

const cloneTables = (source: MemoryTables): MemoryTables => ({
  gridAsset: source.gridAsset.map((r) => ({ ...r })),
  faultReport: source.faultReport.map((r) => ({ ...r })),
  repairTicket: source.repairTicket.map((r) => ({ ...r })),
  crew: source.crew.map((r) => ({ ...r })),
  sparePartUsage: source.sparePartUsage.map((r) => ({ ...r })),
  restoreConfirmation: source.restoreConfirmation.map((r) => ({ ...r })),
  auditLog: source.auditLog.map((r) => ({ ...r }))
});

const emptyTables = (): MemoryTables => ({
  gridAsset: [],
  faultReport: [],
  repairTicket: [],
  crew: [],
  sparePartUsage: [],
  restoreConfirmation: [],
  auditLog: []
});

/**
 * 内存数据库：事务整体排队、串行提交，等价于可串行化隔离级别，
 * FOR UPDATE 行锁在串行调度下退化为空操作；用于无 MySQL 环境与并发测试。
 */
export class MemoryStore implements Database {
  private committed: MemoryTables = emptyTables();
  private tail: Promise<void> = Promise.resolve();

  async transaction<T>(work: (ctx: Ctx) => Promise<T>): Promise<T> {
    let release: () => void = () => undefined;
    const slot = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.tail;
    this.tail = previous.then(() => slot, () => slot);
    await previous;
    const working = cloneTables(this.committed);
    try {
      const result = await work({ client: memoryTx, __memory: { kind: "memory", tables: working } });
      this.committed = working;
      return result;
    } finally {
      release();
    }
  }

  async read<T>(work: (ctx: Ctx) => Promise<T>): Promise<T> {
    const view: MemoryView = { kind: "memory", tables: cloneTables(this.committed) };
    return work({ client: memoryTx, __memory: view });
  }

  async executeScript(): Promise<void> {
    /* 内存库无需建表 */
  }

  async ping(): Promise<void> {
    /* 永远就绪 */
  }

  async close(): Promise<void> {
    /* 无外部资源 */
  }

  /** 测试 / 种子：整体替换已提交数据 */
  seedTables(patch: Partial<MemoryTables>): void {
    this.committed = { ...emptyTables(), ...cloneTables(this.committed), ...patch };
  }

  /** 测试夹具：用给定快照整体覆盖 */
  replaceTables(tables: MemoryTables): void {
    this.committed = cloneTables(tables);
  }

  /** 测试断言：取一份已提交快照 */
  getTables(): MemoryTables {
    return cloneTables(this.committed);
  }

  nextId(table: TableName, rows: Array<{ id: number }>, explicit?: number): number {
    const maxId = rows.reduce((max, r) => Math.max(max, r.id), 0);
    return Math.max(maxId + 1, explicit ?? 0);
  }
}

const memoryTx = {
  async query<T>(): Promise<T[]> {
    throw new Error("内存仓储不经过 SQL，请使用领域仓储方法");
  }
};
