import type { FaultReport } from "../../models/FaultReport";
import type { Ctx } from "./RepoContext";

/** 故障报修仓储端口 */
export interface IFaultReportRepository {
  findById(ctx: Ctx, id: number, forUpdate?: boolean): Promise<FaultReport | null>;
  findAll(ctx: Ctx): Promise<FaultReport[]>;
  save(ctx: Ctx, row: Omit<FaultReport, "id"> & { id?: number }): Promise<FaultReport>;
  updateStatus(
    ctx: Ctx,
    id: number,
    status: FaultReport["status"]
  ): Promise<FaultReport | null>;
}
