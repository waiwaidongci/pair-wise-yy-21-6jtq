import type { Crew } from "../../models/Crew";
import type { Ctx } from "../ports/RepoContext";
import type { ICrewRepository } from "../ports/ICrewRepository";
import { asMemory } from "../ports/RepoContext";

export class MemoryCrewRepository implements ICrewRepository {
  async findById(ctx: Ctx, id: number): Promise<Crew | null> {
    const row = asMemory(ctx).tables.crew.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async findAll(ctx: Ctx): Promise<Crew[]> {
    return asMemory(ctx).tables.crew.map((r) => ({ ...r }));
  }

  async save(ctx: Ctx, row: Omit<Crew, "id"> & { id?: number }): Promise<Crew> {
    const table = asMemory(ctx).tables.crew;
    const id = row.id ?? table.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const saved: Crew = { ...(row as Omit<Crew, "id">), id };
    table.push(saved);
    return { ...saved };
  }

  async releaseIfCurrentTicket(
    ctx: Ctx,
    crewId: number,
    ticketId: number,
    dutyStatus: Crew["duty_status"]
  ): Promise<{ crew: Crew | null; released: boolean }> {
    const row = asMemory(ctx).tables.crew.find((r) => r.id === crewId);
    if (!row) return { crew: null, released: false };
    // 事务串行执行，此处的比对即等价于行锁内比对
    if (row.current_ticket_id !== ticketId) {
      return { crew: { ...row }, released: false };
    }
    row.current_ticket_id = null;
    row.duty_status = dutyStatus;
    return { crew: { ...row }, released: true };
  }
}
