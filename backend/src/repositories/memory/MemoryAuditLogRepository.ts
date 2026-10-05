import type { AuditLogEntry } from "../../models/AuditLogEntry";
import type { Ctx } from "../ports/RepoContext";
import type { IAuditLogRepository } from "../ports/IAuditLogRepository";
import { asMemory } from "../ports/RepoContext";

export class MemoryAuditLogRepository implements IAuditLogRepository {
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
    const table = asMemory(ctx).tables.auditLog;
    const id = table.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    table.push({
      id,
      actor: entry.actor,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      detail: entry.detail,
      created_at: entry.created_at ?? new Date().toISOString()
    });
  }

  async findRecent(ctx: Ctx, limit: number): Promise<AuditLogEntry[]> {
    return asMemory(ctx)
      .tables.auditLog.slice(-limit)
      .reverse()
      .map((r) => ({ ...r }));
  }
}
