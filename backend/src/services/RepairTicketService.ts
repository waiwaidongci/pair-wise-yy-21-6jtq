import { repairTicketRepository } from "../repositories/RepairTicketRepository";
import { gridAssetRepository } from "../repositories/GridAssetRepository";
import { crewRepository } from "../repositories/CrewRepository";
import { store } from "../store";
import {
  VersionConflictError,
  TransactionRollbackError,
  type EntityRow,
} from "../store/JsonStore";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { createRepairTicketRestoreResultDto } from "../constructors/RepairTicketDtoFactory";
import { toAuditTarget } from "../utils/formatters";
import type { RestoreTicketPayload } from "../types/RepairTicketPayload";

/** States from which a ticket can be restored. */
const RESTORABLE_STATUSES = ["ASSIGNED", "ARRIVED", "REPAIRING"];
/** States that count as "fully restored" for asset health recomputation. */
const CLOSED_STATUSES = ["RESTORED", "CLOSED"];
const MAX_ATTEMPTS = 4;

/**
 * A business-level conflict during restoration. The controller maps this to
 * HTTP 409 and includes the current ticket status and the conflict reason so
 * the late dispatcher can see what happened.
 */
export class RestoreConflictError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly currentStatus: string,
    public readonly conflictReason: string,
    public readonly currentVersion: number
  ) {
    super(message);
    this.name = "RestoreConflictError";
  }
}

function log(template: string, ...args: unknown[]): void {
  console.info(`[audit] ${template}`, ...args);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry wrapper.
 *
 * - {@link RestoreConflictError} (state conflict) is final — retrying cannot
 *   change the outcome, so it is re-thrown immediately.
 * - {@link VersionConflictError} (optimistic-lock CAS failure) is retried:
 *   the next attempt re-reads the latest confirmed state and re-evaluates.
 * - {@link TransactionRollbackError} (persistence failure) is retried from
 *   the last confirmed (committed) state with backoff.
 */
async function withRetry<T>(fn: (attempt: number) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (err instanceof RestoreConflictError) {
        log(LOG_TEMPLATES.Restore[2], err.code, err.conflictReason);
        throw err;
      }
      if (err instanceof VersionConflictError) {
        log(LOG_TEMPLATES.Restore[4], `attempt ${attempt} version conflict`, err.currentVersion);
        if (attempt < MAX_ATTEMPTS) {
          await sleep(40 * attempt);
          continue;
        }
        throw new RestoreConflictError(
          ERROR_CODES.TICKET_CONFLICT,
          ERROR_MESSAGES[ERROR_CODES.TICKET_CONFLICT],
          String(err.currentRow?.status ?? "UNKNOWN"),
          "工单已被其他调度员复电，请刷新后查看当前状态",
          err.currentVersion
        );
      }
      if (err instanceof TransactionRollbackError) {
        log(LOG_TEMPLATES.Restore[5], `attempt ${attempt} rolled back`, (err.cause as Error)?.message);
        if (attempt < MAX_ATTEMPTS) {
          await sleep(60 * attempt);
          continue;
        }
        throw new RestoreConflictError(
          ERROR_CODES.RESTORE_FAILED,
          ERROR_MESSAGES[ERROR_CODES.RESTORE_FAILED],
          "UNKNOWN",
          "复电写入失败，已重试至上限",
          0
        );
      }
      // Unknown transient error: retry from the last confirmed state.
      log(LOG_TEMPLATES.Restore[6], `attempt ${attempt} failed`, (err as Error)?.message);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(60 * attempt);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function defaultIdempotencyKey(ticketId: number | string): string {
  return `ticket:${ticketId}:restore`;
}

export const repairTicketService = {
  list: (): EntityRow[] => repairTicketRepository.findAll(),

  get: (id: number | string): EntityRow | undefined => repairTicketRepository.findById(id),

  create: (row: unknown): EntityRow => repairTicketRepository.insert(row as EntityRow),

  /**
   * Confirm restoration of a ticket.
   *
   * Guarantees implemented here:
   * 1. Asset health recovers to NORMAL only when ALL tickets linked to the
   *    asset are restored (recomputed from current associated tickets).
   * 2. The crew is released only when its current in-transit ticket is this
   *    one (matched by `current_ticket_id`).
   * 3. Repeated requests with the same idempotency key return the first
   *    result; a different key against an already-restored ticket is a
   *    conflict (409 with current status + reason).
   * 4. Every restore recomputes from the current associated tickets.
   * 5. Write failures roll back to the last confirmed state and are retried.
   * 6. Confirmed restorations are persisted (ticketRestore records) so they
   *    survive restarts.
   * 7. Optimistic compare-and-swap (version) makes the first concurrent
   *    dispatcher win; the loser sees the current status and conflict reason.
   */
  async restore(
    ticketId: number | string,
    payload: RestoreTicketPayload = {}
  ) {
    const idempotencyKey = payload.idempotency_key ?? defaultIdempotencyKey(ticketId);

    return withRetry(async (attempt) => {
      log(LOG_TEMPLATES.Restore[0], `attempt ${attempt}`, toAuditTarget("RepairTicket", ticketId), idempotencyKey);

      const outcome = store.transact((tx) => {
        // 3. Idempotency: same key → return the first result, no re-processing.
        const existing = tx
          .all("ticketRestore")
          .find((record) => record.idempotency_key === idempotencyKey);
        if (existing) {
          const ticket = tx.findById("repairTicket", ticketId);
          return {
            ticket: ticket ?? null,
            asset: null,
            crew: null,
            restore: existing,
            idempotent: true,
          };
        }

        // 2. Load the ticket from the latest confirmed state.
        const ticket = tx.findById("repairTicket", ticketId);
        if (!ticket) {
          throw new RestoreConflictError(
            ERROR_CODES.TICKET_NOT_FOUND,
            ERROR_MESSAGES[ERROR_CODES.TICKET_NOT_FOUND],
            "MISSING",
            "工单不存在",
            0
          );
        }

        // 3/7. State machine: already restored → conflict (different key).
        if (CLOSED_STATUSES.includes(String(ticket.status))) {
          throw new RestoreConflictError(
            ERROR_CODES.TICKET_CONFLICT,
            ERROR_MESSAGES[ERROR_CODES.TICKET_CONFLICT],
            String(ticket.status),
            "工单已复电，状态冲突",
            Number(ticket.version) || 0
          );
        }
        if (!RESTORABLE_STATUSES.includes(String(ticket.status))) {
          throw new RestoreConflictError(
            ERROR_CODES.TICKET_NOT_RESTORABLE,
            ERROR_MESSAGES[ERROR_CODES.TICKET_NOT_RESTORABLE],
            String(ticket.status),
            "当前工单状态不允许复电",
            Number(ticket.version) || 0
          );
        }

        // 7. Optimistic compare-and-swap: first writer wins.
        const expectedVersion =
          payload.expected_version !== undefined
            ? payload.expected_version
            : Number(ticket.version) || 0;
        const restoredAt = new Date().toISOString();
        const updated = tx.update(
          "repairTicket",
          ticketId,
          { status: "RESTORED", restored_at: restoredAt },
          { expectedVersion }
        );

        // 1. Recompute asset health from ALL currently associated tickets.
        let asset: EntityRow | null = null;
        const report = tx.findById("faultReport", updated.fault_report_id);
        if (report) {
          const assetRow = tx.findById("gridAsset", report.asset_id);
          if (assetRow) {
            const linkedTickets = tx.all("repairTicket").filter((candidate) => {
              const candidateReport = tx.findById("faultReport", candidate.fault_report_id);
              return (
                candidateReport &&
                String(candidateReport.asset_id) === String(assetRow.id)
              );
            });
            const allRestored = linkedTickets.every((candidate) =>
              CLOSED_STATUSES.includes(String(candidate.status))
            );
            if (allRestored) {
              asset = tx.update("gridAsset", assetRow.id, { health_status: "NORMAL" });
            } else {
              asset = assetRow;
            }
          }
        }

        // 2. Release the crew only when its current in-transit ticket is this one.
        let crew: EntityRow | null = null;
        const dispatchedCrew = tx
          .all("crew")
          .find((member) => String(member.current_ticket_id) === String(ticketId));
        if (dispatchedCrew && String(dispatchedCrew.current_ticket_id) === String(ticketId)) {
          crew = tx.update("crew", dispatchedCrew.id, {
            duty_status: "AVAILABLE",
            current_ticket_id: null,
          });
        }

        // 6. Persist the confirmed restoration (survives restarts).
        const restoreRecord = tx.insert("ticketRestore", {
          ticket_id: ticketId,
          idempotency_key: idempotencyKey,
          status: "CONFIRMED",
          restored_at: restoredAt,
          dispatcher_id: payload.dispatcher_id ?? updated.dispatcher_id,
          result: {
            ticket_status: "RESTORED",
            asset_health: asset ? asset.health_status : null,
            crew_released: Boolean(crew),
          },
          created_at: restoredAt,
        });

        return {
          ticket: updated,
          asset,
          crew,
          restore: restoreRecord,
          idempotent: false,
        };
      });

      if (outcome.idempotent) {
        log(LOG_TEMPLATES.Restore[1], toAuditTarget("RepairTicket", ticketId), "idempotent hit");
      } else {
        log(
          LOG_TEMPLATES.Restore[3],
          toAuditTarget("RepairTicket", ticketId),
          `asset=${outcome.asset ? outcome.asset.health_status : "n/a"}`,
          `crew=${outcome.crew ? outcome.crew.id : "n/a"}`
        );
      }

      return createRepairTicketRestoreResultDto(outcome);
    });
  },

  // Exposed for cross-entity coordination checks.
  recomputeAssetHealth: async (assetId: number | string): Promise<EntityRow | undefined> => {
    const tickets = repairTicketRepository.findByAsset(assetId);
    const allRestored = tickets.every((ticket) =>
      CLOSED_STATUSES.includes(String(ticket.status))
    );
    if (!allRestored) return gridAssetRepository.findById(assetId);
    return gridAssetRepository.update(assetId, { health_status: "NORMAL" });
  },

  releaseCrewForTicket: async (ticketId: number | string): Promise<EntityRow | undefined> => {
    const ticket = repairTicketRepository.findById(ticketId);
    if (!ticket) return undefined;
    const dispatched = crewRepository.findByCurrentTicket(ticketId);
    if (!dispatched || String(dispatched.current_ticket_id) !== String(ticketId)) return undefined;
    return crewRepository.update(dispatched.id, {
      duty_status: "AVAILABLE",
      current_ticket_id: null,
    });
  },
};
