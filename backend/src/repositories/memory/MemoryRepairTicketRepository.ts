import type { RepairTicket } from "../../models/RepairTicket";
import type { Ctx } from "../ports/RepoContext";
import type {
  IRepairTicketRepository,
  RestoreTicketPatch
} from "../ports/IRepairTicketRepository";
import { asMemory } from "../ports/RepoContext";

export class MemoryRepairTicketRepository implements IRepairTicketRepository {
  async findByIdForUpdate(ctx: Ctx, id: number): Promise<RepairTicket | null> {
    const row = asMemory(ctx).tables.repairTicket.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async findById(ctx: Ctx, id: number): Promise<RepairTicket | null> {
    const row = asMemory(ctx).tables.repairTicket.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async findAll(ctx: Ctx): Promise<RepairTicket[]> {
    return asMemory(ctx).tables.repairTicket.map((r) => ({ ...r }));
  }

  async save(
    ctx: Ctx,
    row: Omit<RepairTicket, "id"> & { id?: number }
  ): Promise<RepairTicket> {
    const table = asMemory(ctx).tables.repairTicket;
    const id = row.id ?? table.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const saved: RepairTicket = { ...(row as Omit<RepairTicket, "id">), id };
    table.push(saved);
    return { ...saved };
  }

  async findByFaultReportIdsForUpdate(
    ctx: Ctx,
    faultReportIds: number[]
  ): Promise<RepairTicket[]> {
    const wanted = new Set(faultReportIds);
    return asMemory(ctx)
      .tables.repairTicket.filter((r) => wanted.has(r.fault_report_id))
      .sort((a, b) => a.id - b.id)
      .map((r) => ({ ...r }));
  }

  async applyRestore(
    ctx: Ctx,
    id: number,
    expectedVersion: number,
    patch: RestoreTicketPatch
  ): Promise<{ ticket: RepairTicket | null; changed: boolean }> {
    const row = asMemory(ctx).tables.repairTicket.find((r) => r.id === id);
    if (!row) return { ticket: null, changed: false };
    if (row.version !== expectedVersion) return { ticket: { ...row }, changed: false };
    row.status = patch.status;
    row.restored_at = patch.restored_at;
    row.restored_by = patch.restored_by;
    row.restore_request_id = patch.restore_request_id;
    row.version += 1;
    return { ticket: { ...row }, changed: true };
  }
}
