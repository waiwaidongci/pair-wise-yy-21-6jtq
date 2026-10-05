import type { RepairTicket } from "../types/RepairTicket";

export const createDefaultRepairTicket = (overrides: Partial<RepairTicket> = {}): RepairTicket => ({
  id: 1 as never,
  fault_report_id: 1 as never,
  team_id: 1 as never,
  dispatcher_id: 1 as never,
  priority: "HIGH" as never,
  status: "REPAIRING" as never,
  assigned_at: "2026-10-01T09:00:00Z" as never,
  restored_at: null,
  version: 1,
  ...overrides,
});

export const createRepairTicketForm = createDefaultRepairTicket;
export const createRepairTicketResponse = createDefaultRepairTicket;
