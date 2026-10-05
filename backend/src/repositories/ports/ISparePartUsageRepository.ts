import type { SparePartUsage } from "../../models/SparePartUsage";
import type { Ctx } from "./RepoContext";

/** 备件领用仓储端口 */
export interface ISparePartUsageRepository {
  findAll(ctx: Ctx): Promise<SparePartUsage[]>;
  findByTicketId(ctx: Ctx, ticketId: number): Promise<SparePartUsage[]>;
  save(ctx: Ctx, row: Omit<SparePartUsage, "id"> & { id?: number }): Promise<SparePartUsage>;
}
