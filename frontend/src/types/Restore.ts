import type { RepairTicket } from "./RepairTicket";
import type { GridAsset } from "./GridAsset";
import type { FaultReport } from "./FaultReport";
import type { Crew } from "./Crew";

/** 一次复电确认联动的四类处置结果（与后端同一份依据） */
export interface RestoreOutcome {
  ticket: RepairTicket;
  asset: GridAsset;
  faultReport: FaultReport;
  crew: Crew | null;
  activeTicketIds: number[];
  crewReleased: boolean;
}

export type RestoreResponseKind = "RESTORED" | "REPLAYED" | "CONFLICT";

export interface RestoreResponse {
  kind: "RESTORED" | "CONFLICT";
  requestId: string;
  outcome: RestoreOutcome;
  conflict: {
    winnerDispatcherId: number;
    loserDispatcherId: number;
    reason: string;
  } | null;
}

export interface RestorePayload {
  requestId?: string;
  restoredAt?: string;
}
