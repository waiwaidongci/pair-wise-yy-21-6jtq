import type { EntityRow } from "../store/JsonStore";

export const createRepairTicketDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  fault_report_id: 1,
  team_id: 1,
  dispatcher_id: 1,
  priority: "HIGH",
  status: "REPAIRING",
  assigned_at: "2026-10-01T09:00:00Z",
  restored_at: null,
  version: 1,
  ...overrides,
});

export interface RestoreResultDto {
  ticket: EntityRow | null;
  asset: EntityRow | null;
  crew: EntityRow | null;
  restore: EntityRow | null;
  idempotent: boolean;
}

export const createRepairTicketRestoreResultDto = (
  overrides: Partial<RestoreResultDto> = {}
): RestoreResultDto => ({
  ticket: null,
  asset: null,
  crew: null,
  restore: null,
  idempotent: false,
  ...overrides,
});
