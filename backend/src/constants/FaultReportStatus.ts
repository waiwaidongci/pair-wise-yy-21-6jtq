export const FaultReportStatus = [
  "PENDING",
  "IN_REPAIR",
  "RESOLVED",
  "MERGED"
] as const;
export type FaultReportStatus = (typeof FaultReportStatus)[number];

/** 报修单仍有在途工单时的状态 */
export const FAULT_ACTIVE_STATUS: FaultReportStatus = "IN_REPAIR";
/** 报修单关联工单全部复电后的状态 */
export const FAULT_RESOLVED_STATUS: FaultReportStatus = "RESOLVED";
