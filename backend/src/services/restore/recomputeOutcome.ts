import { ACTIVE_TICKET_STATUSES, type TicketStatus } from "../../constants/TicketStatus";
import { NORMAL_HEALTH } from "../../constants/healthDefaults";
import { ACTIVE_HEALTH_STATUS } from "../../constants/AssetHealthStatus";
import {
  FAULT_ACTIVE_STATUS,
  FAULT_RESOLVED_STATUS
} from "../../constants/FaultReportStatus";
import type { AssetHealthStatus } from "../../constants/AssetHealthStatus";
import type { RepairTicket } from "../../models/RepairTicket";
import type { GridAsset } from "../../models/GridAsset";
import type { FaultReport } from "../../models/FaultReport";

export interface RecomputeInput {
  /** 当前事务内加锁读到的、与目标资产关联的全部工单（按当前关联工单重新计算） */
  relatedTickets: RepairTicket[];
  /** 受影响的故障报修单（通常一张，保留合并场景） */
  faultReports: FaultReport[];
  asset: GridAsset;
}

export interface RecomputeResult {
  /** 仍在途的工单 id */
  activeTicketIds: number[];
  /** 资产目标健康状态：全部复电才恢复基准档位，否则标记劣化 */
  targetAssetHealth: AssetHealthStatus | string;
  /** 每张故障单的目标状态 */
  faultStatusByReport: Map<number, FaultReport["status"]>;
  /** 资产是否恢复正常 */
  assetRestoredToNormal: boolean;
}

/**
 * 纯函数：每一张单复电都基于“当前关联工单”重新计算资产/报修状态，
 * 不缓存上一次的判断，保证线路上多张抢修单不会被一张单提前清零。
 */
export const recomputeAssetAndFaults = (input: RecomputeInput): RecomputeResult => {
  const byFault = new Map<number, RepairTicket[]>();
  for (const ticket of input.relatedTickets) {
    const list = byFault.get(ticket.fault_report_id) ?? [];
    list.push(ticket);
    byFault.set(ticket.fault_report_id, list);
  }

  const activeTicketIds: number[] = [];
  const faultStatusByReport = new Map<number, FaultReport["status"]>();

  for (const faultReport of input.faultReports) {
    const tickets = byFault.get(faultReport.id) ?? [];
    const active = tickets.filter((t) => ACTIVE_TICKET_STATUSES.has(t.status as TicketStatus));
    active.forEach((t) => activeTicketIds.push(t.id));
    faultStatusByReport.set(
      faultReport.id,
      active.length === 0 ? FAULT_RESOLVED_STATUS : FAULT_ACTIVE_STATUS
    );
  }

  // 同一资产跨报修单的在途工单也要一并看（一条线路同时挂多张抢修单）
  for (const ticket of input.relatedTickets) {
    if (
      ACTIVE_TICKET_STATUSES.has(ticket.status as TicketStatus) &&
      !activeTicketIds.includes(ticket.id)
    ) {
      activeTicketIds.push(ticket.id);
    }
  }
  activeTicketIds.sort((a, b) => a - b);

  const assetRestoredToNormal = activeTicketIds.length === 0;
  const targetAssetHealth = assetRestoredToNormal
    ? input.asset.baseline_health_status || NORMAL_HEALTH
    : ACTIVE_HEALTH_STATUS;

  return {
    activeTicketIds,
    targetAssetHealth,
    faultStatusByReport,
    assetRestoredToNormal
  };
};

export { NORMAL_HEALTH };
