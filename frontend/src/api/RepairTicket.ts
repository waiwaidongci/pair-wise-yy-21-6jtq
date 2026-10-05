import { mockData } from "../mocks/seedData";
import type { RepairTicket } from "../types/RepairTicket";

const endpoint = "/api/repair-ticket";

export interface RestoreResult {
  ticket: RepairTicket | null;
  asset: { id: number; health_status: string } | null;
  crew: { id: number; duty_status: string; current_ticket_id: number | null } | null;
  restore: { id: number; idempotency_key: string; status: string; restored_at: string } | null;
  idempotent: boolean;
}

export interface RestoreConflict {
  code: string;
  message: string;
  current_status: string;
  conflict_reason: string;
  current_version: number;
}

async function authHeaders(): Promise<HeadersInit> {
  // In development the backend accepts x-role headers; in production a JWT
  // would be attached here.
  return {
    "Content-Type": "application/json",
    "x-role": "dispatcher",
    "x-user-id": "1",
  };
}

export async function listRepairTicket(): Promise<RepairTicket[]> {
  try {
    const res = await fetch(endpoint, { headers: await authHeaders() });
    if (res.ok) return await res.json();
  } catch {
    // Local mock fallback keeps the UI available during offline review.
  }
  return [...(mockData.repairTicket as unknown as RepairTicket[])];
}

export async function saveRepairTicket(payload: Partial<RepairTicket>): Promise<RepairTicket> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`save failed: ${res.status}`);
  return res.json();
}

/**
 * Confirm restoration of a ticket.
 *
 * Sends a unique idempotency key per restore action so that retries of the
 * same click reuse the first result, while a different dispatcher's request
 * against an already-restored ticket yields a 409 conflict with the current
 * status and reason.
 */
export async function restoreRepairTicket(
  ticketId: number,
  payload: { idempotency_key: string; expected_version?: number; dispatcher_id?: number }
): Promise<RestoreResult> {
  const res = await fetch(`${endpoint}/${ticketId}/restore`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    const conflict = (await res.json()) as RestoreConflict;
    const error = new Error(conflict.message) as Error & { conflict?: RestoreConflict };
    error.conflict = conflict;
    throw error;
  }
  if (!res.ok) {
    throw new Error(`restore failed: ${res.status}`);
  }
  return res.json();
}
