export const toAuditTarget = (type: string, id: string | number) => `${type}#${id}`;

/** 复电相关时间统一展示为秒级本地时间（null 显示 —） */
export const formatRestoreTime = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString("zh-CN") : "—";

/** 把在途工单 id 列表渲染为审计/日志友好的文本 */
export const formatActiveTicketIds = (ids: number[]): string =>
  ids.length === 0 ? "none" : ids.join(",");
