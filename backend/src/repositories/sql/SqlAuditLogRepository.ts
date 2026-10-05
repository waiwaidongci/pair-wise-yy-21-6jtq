import type { AuditLogEntry } from "../../models/AuditLogEntry";
import type { Ctx } from "../ports/RepoContext";
import type { IAuditLogRepository } from "../ports/IAuditLogRepository";
import { num, str, toIso } from "./rowMappers";

const mapRow = (row: Record<string, unknown>): AuditLogEntry => ({
  id: num(row.id),
  actor: str(row.actor),
  action: str(row.action),
  target_type: str(row.target_type),
  target_id: str(row.target_id),
  detail: str(row.detail),
  created_at: toIso(row.created_at) ?? ""
});

export class SqlAuditLogRepository implements IAuditLogRepository {
  async append(
    ctx: Ctx,
    entry: {
      actor: string;
      action: string;
      target_type: string;
      target_id: string;
      detail: string;
      created_at?: string;
    }
  ): Promise<void> {
    await ctx.client.query(
      `INSERT INTO audit_log (actor, action, target_type, target_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.actor,
        entry.action,
        entry.target_type,
        entry.target_id,
        entry.detail,
        entry.created_at ?? new Date().toISOString()
      ]
    );
  }

  async findRecent(ctx: Ctx, limit: number): Promise<AuditLogEntry[]> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT id, actor, action, target_type, target_id, detail, created_at
         FROM audit_log ORDER BY id DESC LIMIT ?`,
      [limit]
    );
    return rows.map(mapRow);
  }
}
