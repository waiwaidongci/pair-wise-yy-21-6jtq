export const TicketStatus = ["WAIT_DISPATCH","ASSIGNED","ARRIVED","REPAIRING","RESTORED","CLOSED"] as const;
export type TicketStatus = (typeof TicketStatus)[number];
export const TicketStatusText: Record<TicketStatus, string> = {
  WAIT_DISPATCH: "待派工",
  ASSIGNED: "已派工",
  ARRIVED: "已到场",
  REPAIRING: "抢修中",
  RESTORED: "已复电",
  CLOSED: "已归档"
};
/** 仍在途、可以执行复电确认的状态 */
export const RESTORABLE_TICKET_STATUSES: readonly TicketStatus[] = ["ASSIGNED", "ARRIVED", "REPAIRING"];
export const isRestorable = (status: string): boolean =>
  (RESTORABLE_TICKET_STATUSES as readonly string[]).includes(status);
