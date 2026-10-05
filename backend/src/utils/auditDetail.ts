import type { RestoreOutcome } from "../types/RestoreOutcome";

/** 四件套处置结果 -> 一条审计明细，保证资产/报修/工单/班组是同一份依据 */
export const toOutcomeAuditDetail = (outcome: RestoreOutcome): string =>
  JSON.stringify({
    ticket: {
      id: outcome.ticket.id,
      status: outcome.ticket.status,
      restoredAt: outcome.ticket.restored_at,
      restoredBy: outcome.ticket.restored_by
    },
    asset: {
      id: outcome.asset.id,
      healthStatus: outcome.asset.health_status
    },
    faultReport: {
      id: outcome.faultReport.id,
      status: outcome.faultReport.status
    },
    crew: outcome.crew
      ? { id: outcome.crew.id, released: outcome.crewReleased, currentTicketId: outcome.crew.current_ticket_id }
      : null,
    activeTicketIds: outcome.activeTicketIds
  });
