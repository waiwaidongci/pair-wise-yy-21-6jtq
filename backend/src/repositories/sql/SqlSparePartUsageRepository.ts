import type { SparePartUsage } from "../../models/SparePartUsage";
import type { Ctx } from "../ports/RepoContext";
import type { ISparePartUsageRepository } from "../ports/ISparePartUsageRepository";
import { num, str } from "./rowMappers";

const mapRow = (row: Record<string, unknown>): SparePartUsage => ({
  id: num(row.id),
  ticket_id: num(row.ticket_id),
  part_code: str(row.part_code),
  part_name: str(row.part_name),
  quantity: num(row.quantity),
  warehouse_name: str(row.warehouse_name),
  approved_by: str(row.approved_by),
  usage_status: str(row.usage_status, "PENDING")
});

const COLUMNS =
  "id, ticket_id, part_code, part_name, quantity, warehouse_name, approved_by, usage_status";

export class SqlSparePartUsageRepository implements ISparePartUsageRepository {
  async findAll(ctx: Ctx): Promise<SparePartUsage[]> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM spare_part_usage ORDER BY id`
    );
    return rows.map(mapRow);
  }

  async findByTicketId(ctx: Ctx, ticketId: number): Promise<SparePartUsage[]> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM spare_part_usage WHERE ticket_id = ? ORDER BY id`,
      [ticketId]
    );
    return rows.map(mapRow);
  }

  async save(
    ctx: Ctx,
    row: Omit<SparePartUsage, "id"> & { id?: number }
  ): Promise<SparePartUsage> {
    const result = await ctx.client.query<{ insertId: number }>(
      `INSERT INTO spare_part_usage
         (id, ticket_id, part_code, part_name, quantity, warehouse_name, approved_by, usage_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id ?? null,
        row.ticket_id,
        row.part_code,
        row.part_name,
        row.quantity,
        row.warehouse_name,
        row.approved_by,
        row.usage_status
      ]
    );
    return { ...row, id: row.id ?? result[0]?.insertId } as SparePartUsage;
  }
}
