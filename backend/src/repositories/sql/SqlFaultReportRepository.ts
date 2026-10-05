import type { FaultReport } from "../../models/FaultReport";
import type { Ctx } from "../ports/RepoContext";
import type { IFaultReportRepository } from "../ports/IFaultReportRepository";
import { num, str } from "./rowMappers";

const mapRow = (row: Record<string, unknown>): FaultReport => ({
  id: num(row.id),
  reporter_name: str(row.reporter_name),
  phone: str(row.phone),
  asset_id: num(row.asset_id),
  fault_type: str(row.fault_type),
  address_desc: str(row.address_desc),
  severity: str(row.severity),
  report_channel: str(row.report_channel),
  status: str(row.status, "PENDING")
});

const COLUMNS =
  "id, reporter_name, phone, asset_id, fault_type, address_desc, severity, report_channel, status";

export class SqlFaultReportRepository implements IFaultReportRepository {
  async findById(ctx: Ctx, id: number, forUpdate = false): Promise<FaultReport | null> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM fault_report WHERE id = ?${forUpdate ? " FOR UPDATE" : ""}`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findAll(ctx: Ctx): Promise<FaultReport[]> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM fault_report ORDER BY id`
    );
    return rows.map(mapRow);
  }

  async save(ctx: Ctx, row: Omit<FaultReport, "id"> & { id?: number }): Promise<FaultReport> {
    const result = await ctx.client.query<{ insertId: number }>(
      `INSERT INTO fault_report (id, reporter_name, phone, asset_id, fault_type, address_desc, severity, report_channel, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id ?? null,
        row.reporter_name,
        row.phone,
        row.asset_id,
        row.fault_type,
        row.address_desc,
        row.severity,
        row.report_channel,
        row.status
      ]
    );
    return { ...row, id: row.id ?? result[0]?.insertId } as FaultReport;
  }

  async updateStatus(
    ctx: Ctx,
    id: number,
    status: FaultReport["status"]
  ): Promise<FaultReport | null> {
    await ctx.client.query(`UPDATE fault_report SET status = ? WHERE id = ?`, [status, id]);
    return this.findById(ctx, id);
  }
}
