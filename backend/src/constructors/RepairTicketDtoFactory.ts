import type { RepairTicket } from "../models/RepairTicket";

/** 抢修工单默认 DTO / 新建表单对象（页面、service 不得散写默认结构） */
export const createRepairTicketDto = (overrides: Partial<RepairTicket> = {}): RepairTicket => ({
  id: 0,
  fault_report_id: 0,
  team_id: 0,
  dispatcher_id: 0,
  priority: "MEDIUM",
  status: "WAIT_DISPATCH",
  assigned_at: null,
  restored_at: null,
  restored_by: null,
  restore_request_id: null,
  version: 0,
  ...overrides
});
