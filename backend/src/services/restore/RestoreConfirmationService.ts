import type { RepositoryBundle } from "../../repositories";
import type { Ctx } from "../../repositories/ports/RepoContext";
import type { RestoreConfirmation } from "../../models/RestoreConfirmation";
import type { RestoreResponse } from "../../types/RestoreOutcome";
import type { RestoreSnapshot } from "../../types/RestoreSnapshot";
import { config } from "../../config/env";
import { isRetryableDbError } from "../../repositories/ports/Database";
import { encodeSnapshot, decodeSnapshot, snapshotToResponse } from "../../types/RestoreSnapshot";
import { badRequest } from "../../utils/errors";
import { renderLog } from "../../utils/logRenderer";
import { applyConfirmationInTx, buildConflictSnapshot } from "./restoreApplier";

export interface RestoreRequest {
  ticketId: number;
  dispatcherId: number;
  requestId?: string;
  restoredAt?: string;
}

const newRequestId = (ticketId: number) =>
  `rst-${ticketId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * 复电确认编排：
 * 1. CONFIRMED 先独立落盘（写失败可重试、服务重启不丢）；
 * 2. 处置四件套在一个事务内完成（从最近确认状态可重入）；
 * 3. 同一 requestId 的重复请求沿用首次结果；
 * 4. 两名调度员并发时先到者生效，后到者拿到当前状态与冲突原因。
 */
export const createRestoreConfirmationService = (repos: RepositoryBundle) => {
  /** 处理一条已 CONFIRMED 的记录：应用（带锁冲突重试）并推进阶段 */
  const settle = async (
    confirmation: RestoreConfirmation,
    attemptSeed = 1
  ): Promise<RestoreResponse> => {
    let attempt = attemptSeed;
    // 从最近确认状态重试：事务回滚不影响 CONFIRMED 记录
    for (;;) {
      try {
        const apply = await repos.db.transaction(async (tx) => {
          const ctx: Ctx = tx as Ctx;
          const applied = await applyConfirmationInTx(repos, ctx, confirmation, attempt);
          if (applied.outcome === "RESTORED") {
            const snapshot: RestoreSnapshot = {
              kind: "RESTORED",
              outcome: applied.outcomeData
            };
            await repos.restoreConfirmation.markApplied(
              ctx,
              confirmation.id,
              encodeSnapshot(snapshot),
              attempt
            );
            return snapshotToResponse(confirmation.request_id, snapshot);
          }
          // 竞争失败：固化冲突快照，CONFIRMED -> CONFLICTED
          const conflictSnapshot = await buildConflictSnapshot(
            repos,
            ctx,
            confirmation,
            applied
          );
          await repos.restoreConfirmation.markConflicted(
            ctx,
            confirmation.id,
            encodeSnapshot(conflictSnapshot),
            attempt
          );
          await repos.auditLog.append(ctx, {
            actor: `dispatcher:${confirmation.dispatcher_id}`,
            action: renderLog("RepairTicket", 3, {
              ticketId: confirmation.ticket_id,
              requestId: confirmation.request_id,
              dispatcherId: confirmation.dispatcher_id,
              restoredAt: confirmation.restored_at
            }).replace("复电确认", "复电冲突"),
            target_type: "RepairTicket",
            target_id: String(confirmation.ticket_id),
            detail: conflictSnapshot.conflict?.reason ?? "复电冲突",
            created_at: confirmation.restored_at
          });
          return snapshotToResponse(confirmation.request_id, conflictSnapshot);
        });
        return apply;
      } catch (err) {
        if (isRetryableDbError(err) && attempt < config.restore.maxTxRetries) {
          attempt += 1;
          await repos.db.read(async (tx) => {
            await repos.restoreConfirmation.bumpAttempts(tx as Ctx, confirmation.id, attempt);
          }).catch(() => undefined);
          continue;
        }
        throw err;
      }
    }
  };

  const replayFrom = (
    confirmation: RestoreConfirmation
  ): RestoreResponse | null => {
    if (!confirmation.result_snapshot) return null;
    return snapshotToResponse(
      confirmation.request_id,
      decodeSnapshot(confirmation.result_snapshot)
    );
  };

  /** 服务重启后把所有停留在 CONFIRMED 的记录续作完成 */
  const recoverPending = async (): Promise<number> => {
    const pending = await repos.db.transaction(async (tx) =>
      repos.restoreConfirmation.findPending(tx as Ctx)
    );
    for (const confirmation of pending) {
      await settle(confirmation, confirmation.attempts + 1);
    }
    return pending.length;
  };

  const confirm = async (request: RestoreRequest): Promise<RestoreResponse> => {
    if (!Number.isInteger(request.ticketId) || request.ticketId <= 0) {
      throw badRequest("VALIDATION_FAILED", { reason: "ticketId 非法" });
    }

    // 同一 requestId 的重复请求：无论阶段如何都沿用首次结果
    const requestId = request.requestId?.trim() || newRequestId(request.ticketId);
    const restoredAt = request.restoredAt ?? new Date().toISOString();

    const inserted = await repos.db.transaction(async (tx) => {
      const result = await repos.restoreConfirmation.insertConfirmed(tx as Ctx, {
        request_id: requestId,
        ticket_id: request.ticketId,
        dispatcher_id: request.dispatcherId,
        restored_at: restoredAt
      });
      if (result.created) {
        await repos.auditLog.append(tx as Ctx, {
          actor: `dispatcher:${request.dispatcherId}`,
          action: renderLog("RepairTicket", 3, {
            ticketId: request.ticketId,
            requestId,
            dispatcherId: request.dispatcherId,
            restoredAt
          }),
          target_type: "RepairTicket",
          target_id: String(request.ticketId),
          detail: `stage=CONFIRMED`
        });
      }
      return result;
    });

    if (!inserted.created && inserted.existing) {
      const existing = inserted.existing;
      const replayed = replayFrom(existing);
      if (replayed) {
        // 命中首次结果：包括 APPLIED（正常/冲突）两种
        await repos.db
          .read(async (tx) =>
            repos.auditLog.append(tx as Ctx, {
              actor: `dispatcher:${request.dispatcherId}`,
              action: renderLog("RepairTicket", 4, { requestId: existing.request_id }),
              target_type: "RepairTicket",
              target_id: String(existing.ticket_id),
              detail: `重复请求沿用首次结果，首次调度员=${existing.dispatcher_id}，阶段=${existing.stage}`
            })
          )
          .catch(() => undefined);
        return replayed;
      }
      // 首次确认已落盘但尚未 APPLIED（前次写失败或正在处理中）：从最近确认状态继续
      return settle(existing, existing.attempts + 1);
    }

    const confirmation = inserted.existing;
    if (!confirmation) {
      throw new Error("复电确认记录写入后无法读回");
    }
    return settle(confirmation, 1);
  };

  const getByRequestId = async (requestId: string): Promise<RestoreResponse | null> => {
    const record = await repos.db.read(async (tx) =>
      repos.restoreConfirmation.findByRequestId(tx as Ctx, requestId)
    );
    return record ? replayFrom(record) : null;
  };

  return { confirm, recoverPending, getByRequestId };
};

export type RestoreConfirmationService = ReturnType<typeof createRestoreConfirmationService>;
