/** 复电确认幂等记录的处理阶段 */
export const ConfirmationStage = [
  /** 首次确认已持久落盘，处置四件套尚未全部完成（崩溃/写失败后从这里续作） */
  "CONFIRMED",
  /** 处置已全部完成，结果快照已固化 */
  "APPLIED",
  /** 竞争失败：工单已被另一位先到调度员复电 */
  "CONFLICTED"
] as const;
export type ConfirmationStage = (typeof ConfirmationStage)[number];
