import type { RepairTicket } from "../../models/RepairTicket";
import type { TicketStatus } from "../../constants/TicketStatus";
import type { Ctx } from "./RepoContext";

export interface RestoreTicketPatch {
  status: TicketStatus;
  restored_at: string;
  restored_by: number;
  restore_request_id: string;
  version: number;
}

/** 抢修工单仓储端口 */
export interface IRepairTicketRepository {
  findByIdForUpdate(ctx: Ctx, id: number): Promise<RepairTicket | null>;
  findById(ctx: Ctx, id: number): Promise<RepairTicket | null>;
  findAll(ctx: Ctx): Promise<RepairTicket[]>;
  save(ctx: Ctx, row: Omit<RepairTicket, "id"> & { id?: number }): Promise<RepairTicket>;
  /** 按故障单（资产）取出工单并加锁，用于按“当前关联工单”重算在途集合 */
  findByFaultReportIdsForUpdate(ctx: Ctx, faultReportIds: number[]): Promise<RepairTicket[]>;
  /** 乐观锁：version 未变化才写入；两名调度员并发时只有先到者成功 */
  applyRestore(
    ctx: Ctx,
    id: number,
    expectedVersion: number,
    patch: RestoreTicketPatch
  ): Promise<{ ticket: RepairTicket | null; changed: boolean }>;
}
