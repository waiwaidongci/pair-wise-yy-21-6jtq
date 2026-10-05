export const TicketStatus = [
  "WAIT_DISPATCH",
  "ASSIGNED",
  "ARRIVED",
  "REPAIRING",
  "RESTORED",
  "CLOSED"
] as const;
export type TicketStatus = (typeof TicketStatus)[number];

/** 允许执行复电确认的在途状态（尚未复电） */
export const RESTORABLE_STATUSES: ReadonlySet<TicketStatus> = new Set<TicketStatus>([
  "ASSIGNED",
  "ARRIVED",
  "REPAIRING"
]);

/** 仍算在途、尚未完成处置的工单状态 */
export const ACTIVE_TICKET_STATUSES: ReadonlySet<TicketStatus> = new Set<TicketStatus>([
  "WAIT_DISPATCH",
  "ASSIGNED",
  "ARRIVED",
  "REPAIRING"
]);
