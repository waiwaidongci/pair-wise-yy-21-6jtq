export interface RestoreTicketPayload {
  dispatcher_id?: number;
  /** Version the caller based its decision on; used for optimistic compare-and-swap. */
  expected_version?: number;
  /** Client-supplied idempotency key; retries of the same request reuse it. */
  idempotency_key?: string;
}

export type RepairTicketPayload = Record<string, unknown>;
