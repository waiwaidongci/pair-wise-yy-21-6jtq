export const LOG_TEMPLATES = {
  GridAsset: [
    "GridAsset.create 资产 {assetCode} 入台账，健康状态 {healthStatus}",
    "GridAsset.update 资产 {assetId} 字段变更：{changes}",
    "GridAsset.status 资产 {assetCode} 健康状态 {from} -> {to}（依据工单 {ticketIds}）",
    "GridAsset.export 导出资产台账，共 {count} 条"
  ],
  FaultReport: [
    "FaultReport.create 登记报修 {faultReportId}（{faultType}），关联资产 {assetId}",
    "FaultReport.update 报修 {faultReportId} 字段变更：{changes}",
    "FaultReport.status 报修 {faultReportId} 状态 {from} -> {to}（在途工单 {activeCount}/{totalCount}）",
    "FaultReport.export 导出报修列表，共 {count} 条"
  ],
  RepairTicket: [
    "RepairTicket.create 工单 {ticketId} 派发给班组 {crewId}，调度员 {dispatcherId}",
    "RepairTicket.update 工单 {ticketId} 字段变更：{changes}",
    "RepairTicket.status 工单 {ticketId} 状态 {from} -> {to}，调度员 {dispatcherId}",
    "RepairTicket.restore 工单 {ticketId} 复电确认（requestId={requestId}，调度员 {dispatcherId}），restoredAt={restoredAt}",
    "RepairTicket.replay 复电确认 requestId={requestId} 命中幂等记录，沿用首次结果",
    "RepairTicket.recover 复电确认 requestId={requestId} 从 {stage} 阶段重试落库",
    "RepairTicket.export 导出工单列表，共 {count} 条"
  ],
  Crew: [
    "Crew.create 班组 {name} 建立值班，状态 {dutyStatus}",
    "Crew.update 班组 {crewId} 字段变更：{changes}",
    "Crew.status 班组 {crewId} 状态 {from} -> {to}（在途工单 {ticketId}）",
    "Crew.release 工单 {ticketId} 复电，仅当班组 {crewId} 当前在途工单匹配时释放",
    "Crew.export 导出班组列表，共 {count} 条"
  ],
  SparePartUsage: [
    "SparePartUsage.create 工单 {ticketId} 申领备件 {partCode} x{quantity}",
    "SparePartUsage.update 备件领用 {usageId} 字段变更：{changes}",
    "SparePartUsage.status 备件领用 {usageId} 状态 {from} -> {to}",
    "SparePartUsage.export 导出备件领用记录，共 {count} 条"
  ]
} as const;

export type LogTemplateName =
  | "GridAsset.status"
  | "FaultReport.status"
  | "RepairTicket.status"
  | "RepairTicket.restore"
  | "RepairTicket.replay"
  | "RepairTicket.recover"
  | "Crew.status"
  | "Crew.release";
