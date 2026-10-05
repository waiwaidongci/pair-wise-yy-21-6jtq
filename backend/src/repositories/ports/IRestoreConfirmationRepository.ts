import type { RestoreConfirmation } from "../../models/RestoreConfirmation";
import type { Ctx } from "./RepoContext";

/** 复电确认权威记录仓储端口（先到者落盘、重启可续） */
export interface IRestoreConfirmationRepository {
  /** request_id 唯一；并发重复插入时第二个拿到先到者记录（null 表示尚无记录） */
  insertConfirmed(
    ctx: Ctx,
    row: {
      request_id: string;
      ticket_id: number;
      dispatcher_id: number;
      restored_at: string;
    }
  ): Promise<{ created: boolean; existing: RestoreConfirmation | null }>;
  findByRequestId(ctx: Ctx, requestId: string): Promise<RestoreConfirmation | null>;
  findById(ctx: Ctx, id: number): Promise<RestoreConfirmation | null>;
  findPending(ctx: Ctx): Promise<RestoreConfirmation[]>;
  markApplied(
    ctx: Ctx,
    id: number,
    snapshot: string,
    attempts: number
  ): Promise<void>;
  /** 竞争失败（工单已被先到者复电）时落为 CONFLICTED，同样固化冲突快照 */
  markConflicted(
    ctx: Ctx,
    id: number,
    snapshot: string,
    attempts: number
  ): Promise<void>;
  bumpAttempts(ctx: Ctx, id: number, attempts: number): Promise<void>;
}
