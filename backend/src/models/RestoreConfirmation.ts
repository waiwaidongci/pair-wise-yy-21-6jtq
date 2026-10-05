import type { ConfirmationStage } from "../constants/ConfirmationStage";

/**
 * 复电确认的权威依据：同一 request_id 只有一条记录。
 * 先到者在 CONFIRMED 阶段落盘（即使后续处置写失败或服务重启也不丢），
 * 处置四件套全部成功后推进到 APPLIED；重复请求直接沿用首次结果。
 */
export interface RestoreConfirmation {
  id: number;
  request_id: string;
  ticket_id: number;
  dispatcher_id: number;
  restored_at: string;
  stage: ConfirmationStage | string;
  /** APPLIED 后固化的处置快照，供重复请求原样回放 */
  result_snapshot: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}
