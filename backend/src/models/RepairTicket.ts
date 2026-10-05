import type { TicketStatus } from "../constants/TicketStatus";

export interface RepairTicket {
  id: number;
  fault_report_id: number;
  team_id: number;
  dispatcher_id: number;
  priority: string;
  status: TicketStatus | string;
  assigned_at: string | null;
  restored_at: string | null;
  /** 首次复电确认生效的调度员（先到者） */
  restored_by: number | null;
  /** 复电确认请求的幂等键来源 */
  restore_request_id: string | null;
  version: number;
}
