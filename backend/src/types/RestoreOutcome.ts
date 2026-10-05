import type { RepairTicket } from "../models/RepairTicket";
import type { GridAsset } from "../models/GridAsset";
import type { FaultReport } from "../models/FaultReport";
import type { Crew } from "../models/Crew";

/** 一次复电确认联动的四类处置结果（同一份依据） */
export interface RestoreOutcome {
  ticket: RepairTicket;
  asset: GridAsset;
  faultReport: FaultReport;
  crew: Crew | null;
  /** 与该资产关联、仍在途的工单（为空才允许资产恢复正常） */
  activeTicketIds: number[];
  /** 班组是否被本次复电释放（仅当 current_ticket_id 命中本工单） */
  crewReleased: boolean;
}

export type RestoreResponseKind = "RESTORED" | "CONFLICT";

export interface RestoreResponse {
  kind: RestoreResponseKind;
  requestId: string;
  /** 首次结果（重复请求 / 冲突时均沿用或对照这一份） */
  outcome: RestoreOutcome;
  /** 后到调度员信息（仅冲突时） */
  conflict: {
    winnerDispatcherId: number;
    loserDispatcherId: number;
    reason: string;
  } | null;
}
