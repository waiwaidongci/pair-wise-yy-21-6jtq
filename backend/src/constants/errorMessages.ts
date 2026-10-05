import { ERROR_CODES } from "./errorCodes";

type TemplateParams = Record<string, string | number | undefined>;

const render = (template: string, params: TemplateParams = {}) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] === undefined ? `{${key}}` : String(params[key])
  );

export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  AUTH_REQUIRED: "缺少登录凭证（Bearer Token）",
  RBAC_DENIED: "当前角色无权执行该操作",
  VALIDATION_FAILED: "请求参数校验失败：{reason}",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  TICKET_NOT_FOUND: "抢修工单不存在：{ticketId}",
  TICKET_NOT_RESTORABLE: "工单 {ticketId} 当前状态为 {status}，不允许复电确认",
  RESTORE_CONFLICT:
    "工单 {ticketId} 的复电结果已由调度员 {winnerDispatcher} 于 {confirmedAt} 首次确认；" +
    "当前状态 {currentStatus}，后到请求（{loserDispatcher}）不覆盖首次结果",
  ASSET_NOT_FOUND: "配网资产不存在：{assetId}",
  CREW_NOT_FOUND: "抢修班组不存在：{crewId}",
  FAULT_REPORT_NOT_FOUND: "故障报修不存在：{faultReportId}",
  IDEMPOTENCY_REPLAYED: "重复的复电确认请求，沿用首次结果（requestId={requestId}）",
  PERSISTENCE_FAILED: "复电结果落库失败：{reason}",
  INTERNAL_ERROR: "服务内部错误"
};

export const renderErrorMessage = (code: keyof typeof ERROR_CODES, params?: TemplateParams) =>
  render(ERROR_MESSAGES[code], params);
