import type { Crew } from "../../models/Crew";
import type { Ctx } from "./RepoContext";

/** 抢修班组仓储端口 */
export interface ICrewRepository {
  findById(ctx: Ctx, id: number, forUpdate?: boolean): Promise<Crew | null>;
  findAll(ctx: Ctx): Promise<Crew[]>;
  save(ctx: Ctx, row: Omit<Crew, "id"> & { id?: number }): Promise<Crew>;
  /**
   * 仅当班组当前在途工单仍指向该工单时才释放（行锁内比对），
   * 避免一张工单复电提前释放正在执行另一张工单的班组。
   */
  releaseIfCurrentTicket(
    ctx: Ctx,
    crewId: number,
    ticketId: number,
    dutyStatus: Crew["duty_status"]
  ): Promise<{ crew: Crew | null; released: boolean }>;
}
