import type { RestoreConfirmation } from "../../models/RestoreConfirmation";
import type { Ctx } from "../ports/RepoContext";
import type { IRestoreConfirmationRepository } from "../ports/IRestoreConfirmationRepository";
import { isUniqueViolation, num, nullableNum, str, toIso } from "./rowMappers";

const mapRow = (row: Record<string, unknown>): RestoreConfirmation => ({
  id: num(row.id),
  request_id: str(row.request_id),
  ticket_id: num(row.ticket_id),
  dispatcher_id: num(row.dispatcher_id),
  restored_at: toIso(row.restored_at) ?? "",
  stage: str(row.stage, "CONFIRMED"),
  result_snapshot: row.result_snapshot === null ? null : str(row.result_snapshot),
  attempts: num(row.attempts, 1),
  created_at: toIso(row.created_at) ?? "",
  updated_at: toIso(row.updated_at) ?? ""
});

const COLUMNS =
  "id, request_id, ticket_id, dispatcher_id, restored_at, stage, result_snapshot, attempts, created_at, updated_at";

export class SqlRestoreConfirmationRepository implements IRestoreConfirmationRepository {
  async insertConfirmed(
    ctx: Ctx,
    row: { request_id: string; ticket_id: number; dispatcher_id: number; restored_at: string }
  ): Promise<{ created: boolean; existing: RestoreConfirmation | null }> {
    try {
      await ctx.client.query(
        `INSERT INTO restore_confirmation
           (request_id, ticket_id, dispatcher_id, restored_at, stage, attempts)
         VALUES (?, ?, ?, ?, 'CONFIRMED', 1)`,
        [row.request_id, row.ticket_id, row.dispatcher_id, row.restored_at]
      );
      const created = await this.findByRequestId(ctx, row.request_id);
      return { created: true, existing: created };
    } catch (err) {
      if (isUniqueViolation(err)) {
        const existing = await this.findByRequestId(ctx, row.request_id);
        return { created: false, existing };
      }
      throw err;
    }
  }

  async findByRequestId(ctx: Ctx, requestId: string): Promise<RestoreConfirmation | null> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM restore_confirmation WHERE request_id = ?`,
      [requestId]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findById(ctx: Ctx, id: number): Promise<RestoreConfirmation | null> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM restore_confirmation WHERE id = ?`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findPending(ctx: Ctx): Promise<RestoreConfirmation[]> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM restore_confirmation
        WHERE stage = 'CONFIRMED'
        ORDER BY id
        FOR UPDATE`
    );
    return rows.map(mapRow);
  }

  async markApplied(ctx: Ctx, id: number, snapshot: string, attempts: number): Promise<void> {
    await ctx.client.query(
      `UPDATE restore_confirmation SET stage = 'APPLIED', result_snapshot = ?, attempts = ? WHERE id = ?`,
      [snapshot, attempts, id]
    );
  }

  async markConflicted(
    ctx: Ctx,
    id: number,
    snapshot: string,
    attempts: number
  ): Promise<void> {
    await ctx.client.query(
      `UPDATE restore_confirmation SET stage = 'CONFLICTED', result_snapshot = ?, attempts = ? WHERE id = ?`,
      [snapshot, attempts, id]
    );
  }

  async bumpAttempts(ctx: Ctx, id: number, attempts: number): Promise<void> {
    await ctx.client.query(
      `UPDATE restore_confirmation SET attempts = ? WHERE id = ?`,
      [attempts, id]
    );
  }
}
