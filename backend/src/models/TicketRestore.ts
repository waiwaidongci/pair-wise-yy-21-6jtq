export interface TicketRestoreResult {
  ticket_status: string;
  asset_health: string | null;
  crew_released: boolean;
}

/**
 * A confirmed restoration record.
 *
 * One row per logical restore operation, keyed by `idempotency_key`.
 * Repeated requests carrying the same key return the stored result instead
 * of re-processing; a different key against an already-restored ticket is a
 * conflict. Persisted so restarts do not lose confirmed restorations.
 */
export interface TicketRestore {
  id: number;
  ticket_id: number;
  idempotency_key: string;
  status: string;
  restored_at: string;
  dispatcher_id: number;
  result: TicketRestoreResult;
  created_at: string;
}
