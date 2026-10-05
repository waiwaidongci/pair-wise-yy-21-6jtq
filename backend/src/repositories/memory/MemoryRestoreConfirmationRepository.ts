import type { RestoreConfirmation } from "../../models/RestoreConfirmation";
import type { Ctx } from "../ports/RepoContext";
import type { IRestoreConfirmationRepository } from "../ports/IRestoreConfirmationRepository";
import { asMemory } from "../ports/RepoContext";

const nowIso = () => new Date().toISOString();

export class MemoryRestoreConfirmationRepository implements IRestoreConfirmationRepository {
  async insertConfirmed(
    ctx: Ctx,
    row: { request_id: string; ticket_id: number; dispatcher_id: number; restored_at: string }
  ): Promise<{ created: boolean; existing: RestoreConfirmation | null }> {
    const table = asMemory(ctx).tables.restoreConfirmation;
    const duplicate = table.find((r) => r.request_id === row.request_id);
    if (duplicate) return { created: false, existing: { ...duplicate } };
    const now = nowIso();
    const id = table.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const created: RestoreConfirmation = {
      id,
      request_id: row.request_id,
      ticket_id: row.ticket_id,
      dispatcher_id: row.dispatcher_id,
      restored_at: row.restored_at,
      stage: "CONFIRMED",
      result_snapshot: null,
      attempts: 1,
      created_at: now,
      updated_at: now
    };
    table.push(created);
    return { created: true, existing: { ...created } };
  }

  async findByRequestId(ctx: Ctx, requestId: string): Promise<RestoreConfirmation | null> {
    const row = asMemory(ctx).tables.restoreConfirmation.find((r) => r.request_id === requestId);
    return row ? { ...row } : null;
  }

  async findById(ctx: Ctx, id: number): Promise<RestoreConfirmation | null> {
    const row = asMemory(ctx).tables.restoreConfirmation.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async findPending(ctx: Ctx): Promise<RestoreConfirmation[]> {
    return asMemory(ctx)
      .tables.restoreConfirmation.filter((r) => r.stage === "CONFIRMED")
      .sort((a, b) => a.id - b.id)
      .map((r) => ({ ...r }));
  }

  async markApplied(ctx: Ctx, id: number, snapshot: string, attempts: number): Promise<void> {
    const row = asMemory(ctx).tables.restoreConfirmation.find((r) => r.id === id);
    if (row) {
      row.stage = "APPLIED";
      row.result_snapshot = snapshot;
      row.attempts = attempts;
      row.updated_at = nowIso();
    }
  }

  async markConflicted(ctx: Ctx, id: number, snapshot: string, attempts: number): Promise<void> {
    const row = asMemory(ctx).tables.restoreConfirmation.find((r) => r.id === id);
    if (row) {
      row.stage = "CONFLICTED";
      row.result_snapshot = snapshot;
      row.attempts = attempts;
      row.updated_at = nowIso();
    }
  }

  async bumpAttempts(ctx: Ctx, id: number, attempts: number): Promise<void> {
    const row = asMemory(ctx).tables.restoreConfirmation.find((r) => r.id === id);
    if (row) {
      row.attempts = attempts;
      row.updated_at = nowIso();
    }
  }
}
