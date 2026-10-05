export const FaultReportStatus = ["PENDING", "IN_REPAIR", "RESOLVED", "MERGED"] as const;
export type FaultReportStatus = (typeof FaultReportStatus)[number];
export const FaultReportStatusText: Record<FaultReportStatus, string> = {
  PENDING: "待处理",
  IN_REPAIR: "抢修中",
  RESOLVED: "已复电",
  MERGED: "已合并"
};
