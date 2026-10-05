import type { Request, Response } from "express";
import { repairTicketService } from "../services/RepairTicketService";
import { asyncHandler } from "../utils/asyncHandler";
import type { RestorePayload } from "../types/RestorePayload";

const getDispatcherId = (req: Request): number =>
  Number((req as Request & { user?: { id?: number } }).user?.id ?? 0);

export const repairTicketController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await repairTicketService.list());
  }),

  detail: asyncHandler(async (req: Request, res: Response) => {
    res.json(await repairTicketService.detail(Number(req.params.id)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await repairTicketService.create(req.body));
  }),

  /**
   * POST /api/repair-ticket/:id/restore
   * 两名调度员并发时先到者生效；重复 requestId 沿用首次结果。
   */
  restore: asyncHandler(async (req: Request, res: Response) => {
    const result = await repairTicketService.restore(
      Number(req.params.id),
      getDispatcherId(req),
      req.body as RestorePayload
    );
    // 冲突仍返回 200 + kind=CONFLICT，让后到者看到“当前状态 + 冲突原因”；
    // 前端按 kind 分流提示。
    res.status(result.kind === "CONFLICT" ? 409 : 200).json(result);
  })
};
