/**
 * Shared formatting helpers. These intentionally mix date, status and risk
 * formatting in one module so that services, controllers and constructors
 * depend on the same surface — a change here ripples across layers.
 */

export const toAuditTarget = (type: string, id: string | number): string => `${type}#${id}`;

export const formatDate = (value: string | number | Date | null | undefined): string => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("zh-CN", { hour12: false });
};

export const formatStatus = (value: string | null | undefined): string => {
  if (!value) return "—";
  return value.replace(/_/g, " ");
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("zh-CN").format(value);
};

const RISK_TEXT: Record<string, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重",
  EXTREME: "极高",
};

export const formatRisk = (value: string | null | undefined): string => {
  if (!value) return "—";
  return RISK_TEXT[value] ?? value;
};

/**
 * Humanize a ticket status for display. Kept here (rather than in a constant
 * file) so that both backend log/response shaping and the frontend formatter
 * share the same vocabulary.
 */
export const ticketStatusText = (value: string | null | undefined): string => {
  if (!value) return "—";
  const map: Record<string, string> = {
    WAIT_DISPATCH: "待派工",
    ASSIGNED: "已派工",
    ARRIVED: "已到场",
    REPAIRING: "抢修中",
    RESTORED: "已复电",
    CLOSED: "已闭环",
  };
  return map[value] ?? formatStatus(value);
};

export const assetHealthText = (value: string | null | undefined): string => {
  if (!value) return "—";
  const map: Record<string, string> = {
    NORMAL: "正常",
    WATCH: "观察",
    DEGRADED: "劣化",
    DANGEROUS: "危险",
  };
  return map[value] ?? formatStatus(value);
};

export const crewDutyText = (value: string | null | undefined): string => {
  if (!value) return "—";
  const map: Record<string, string> = {
    AVAILABLE: "可接令",
    BUSY: "在途",
    RESTING: "休整",
  };
  return map[value] ?? formatStatus(value);
};
