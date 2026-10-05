import type { RepairTicket } from "../../models/RepairTicket";
import type { Ctx } from "../ports/RepoContext";
import type {
  IRepairTicketRepository,
  RestoreTicketPatch
} from "../ports/IRepairTicketRepository";
import { num, nullableNum, str, toIso } from "./rowMappers";

const mapRow = (row: Record<string, unknown>): RepairTicket => ({
  id: num(row.id),
  fault_report_id: num(row.fault_report_id),
  team_id: num(row.team_id),
  dispatcher_id: num(row.dispatcher_id),
  priority: str(row.priority, "MEDIUM"),
  status: str(row.status, "WAIT_DISPATCH"),
  assigned_at: toIso(row.assigned_at),
  restored_at: toIso(row.restored_at),
  restored_by: nullableNum(row.restored_by),
  restore_request_id: row.restore_request_id === null ? null : str(row.restore_request_id),
  version: num(row.version)
});

const COLUMNS =
  "id, fault_report_id, team_id, dispatcher_id, priority, status, assigned_at, restored_at, restored_by, restore_request_id, version";

export class SqlRepairTicketRepository implements IRepairTicketRepository {
  async findByIdForUpdate(ctx: Ctx, id: number): Promise<RepairTicket | null> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM repair_ticket WHERE id = ? FOR UPDATE`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findById(ctx: Ctx, id: number): Promise<RepairTicket | null> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM repair_ticket WHERE id = ?`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findAll(ctx: Ctx): Promise<RepairTicket[]> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM repair_ticket ORDER BY id`
    );
    return rows.map(mapRow);
  }

  async save(
    ctx: Ctx,
    row: Omit<RepairTicket, "id"> & { id?: number }
  ): Promise<RepairTicket> {
    const result = await ctx.client.query<{ insertId: number }>(
      `INSERT INTO repair_ticket
         (id, fault_report_id, team_id, dispatcher_id, priority, status, assigned_at, restored_at, restored_by, restore_request_id, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id ?? null,
        row.fault_report_id,
        row.team_id,
        row.dispatcher_id,
        row.priority,
        row.status,
        row.assigned_at,
        row.restored_at,
        row.restored_by,
        row.restore_request_id,
        row.version
      ]
    );
    return { ...row, id: row.id ?? result[0]?.insertId } as RepairTicket;
  }

  async findByFaultReportIdsForUpdate(
    ctx: Ctx,
    faultReportIds: number[]
  ): Promise<RepairTicket[]> {
    if (faultReportIds.length === 0) return [];
    const placeholders = faultReportIds.map(() => "?").join(",");
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM repair_ticket
        WHERE fault_report_id IN (${placeholders})
        ORDER BY id
        FOR UPDATE`,
      faultReportIds
    );
    return rows.map(mapRow);
  }

  async applyRestore(
    ctx: Ctx,
    id: number,
    expectedVersion: number,
    patch: RestoreTicketPatch
  ): Promise<{ ticket: RepairTicket | null; changed: boolean }> {
    // 乐观锁：两名调度员并发确认时，只有 version 仍为读取值的请求（先到者）写入
    const result = await ctx.client.query<{ affectedRows: number }>(
      `UPDATE repair_ticket
         SET status = ?, restored_at = ?, restored_by = ?, restore_request_id = ?, version = version + 1
       WHERE id = ? AND version = ?`,
      [
        patch.status,
        patch.restored_at,
        patch.restored_by,
        patch.restore_request_id,
        id,
        expectedVersion
      ]
    );
    const changed = (result[0]?.affectedRows ?? 0) > 0;
    return { ticket: await this.findByIdForUpdate(ctx, id), changed };
  }
}
