import type { SparePartUsage } from "../../models/SparePartUsage";
import type { Ctx } from "../ports/RepoContext";
import type { ISparePartUsageRepository } from "../ports/ISparePartUsageRepository";
import { asMemory } from "../ports/RepoContext";

export class MemorySparePartUsageRepository implements ISparePartUsageRepository {
  async findAll(ctx: Ctx): Promise<SparePartUsage[]> {
    return asMemory(ctx).tables.sparePartUsage.map((r) => ({ ...r }));
  }

  async findByTicketId(ctx: Ctx, ticketId: number): Promise<SparePartUsage[]> {
    return asMemory(ctx)
      .tables.sparePartUsage.filter((r) => r.ticket_id === ticketId)
      .map((r) => ({ ...r }));
  }

  async save(
    ctx: Ctx,
    row: Omit<SparePartUsage, "id"> & { id?: number }
  ): Promise<SparePartUsage> {
    const table = asMemory(ctx).tables.sparePartUsage;
    const id = row.id ?? table.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const saved: SparePartUsage = { ...(row as Omit<SparePartUsage, "id">), id };
    table.push(saved);
    return { ...saved };
  }
}
