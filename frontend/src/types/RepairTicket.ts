export interface RepairTicket {
  id: number;
  fault_report_id: number;
  team_id: number;
  dispatcher_id: number;
  priority: string;
  status: string;
  assigned_at: string | null;
  restored_at: string | null;
  restored_by: number | null;
  restore_request_id: string | null;
  version: number;
}
