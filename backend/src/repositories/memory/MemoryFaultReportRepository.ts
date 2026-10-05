import type { FaultReport } from "../../models/FaultReport";
import type { Ctx } from "../ports/RepoContext";
import type { IFaultReportRepository } from "../ports/IFaultReportRepository";
import { asMemory } from "../ports/RepoContext";

export class MemoryFaultReportRepository implements IFaultReportRepository {
  async findById(ctx: Ctx, id: number): Promise<FaultReport | null> {
    const row = asMemory(ctx).tables.faultReport.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async findAll(ctx: Ctx): Promise<FaultReport[]> {
    return asMemory(ctx).tables.faultReport.map((r) => ({ ...r }));
  }

  async save(ctx: Ctx, row: Omit<FaultReport, "id"> & { id?: number }): Promise<FaultReport> {
    const table = asMemory(ctx).tables.faultReport;
    const id = row.id ?? table.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const saved: FaultReport = { ...(row as Omit<FaultReport, "id">), id };
    table.push(saved);
    return { ...saved };
  }

  async updateStatus(
    ctx: Ctx,
    id: number,
    status: FaultReport["status"]
  ): Promise<FaultReport | null> {
    const row = asMemory(ctx).tables.faultReport.find((r) => r.id === id);
    if (!row) return null;
    row.status = status;
    return { ...row };
  }
}
