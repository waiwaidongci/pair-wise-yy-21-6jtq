import { ERROR_CODES } from "./errorCodes";

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_REQUIRED]: "missing bearer token",
  [ERROR_CODES.RBAC_DENIED]: "role denied",
  [ERROR_CODES.VALIDATION_FAILED]: "invalid payload",
  [ERROR_CODES.RATE_LIMITED]: "too many requests",
  [ERROR_CODES.TICKET_NOT_FOUND]: "工单不存在或已被删除",
  [ERROR_CODES.TICKET_CONFLICT]: "工单状态冲突，复电失败",
  [ERROR_CODES.TICKET_NOT_RESTORABLE]: "当前工单状态不允许复电",
  [ERROR_CODES.ASSET_NOT_FOUND]: "配网资产不存在",
  [ERROR_CODES.CREW_NOT_FOUND]: "抢修班组不存在",
  [ERROR_CODES.RESTORE_FAILED]: "复电处理失败，已从最近确认状态重试",
  [ERROR_CODES.RESTORE_IDEMPOTENT_CONFLICT]: "复电请求冲突：该工单已由其他调度员复电",
};
