import type { AuditLogEntry } from "../../models/AuditLogEntry";
import type { Ctx } from "./RepoContext";

export interface IAuditLogRepository {
  append(
    ctx: Ctx,
    entry: {
      actor: string;
      action: string;
      target_type: string;
      target_id: string;
      detail: string;
      created_at?: string;
    }
  ): Promise<void>;
  findRecent(ctx: Ctx, limit: number): Promise<AuditLogEntry[]>;
}
