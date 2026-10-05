import type { Request, Response } from "express";
import { sparePartUsageService } from "../services/SparePartUsageService";
import { asyncHandler } from "../utils/asyncHandler";

export const sparePartUsageController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const ticketId = req.query.ticketId ? Number(req.query.ticketId) : null;
    res.json(
      ticketId
        ? await sparePartUsageService.listByTicket(ticketId)
        : await sparePartUsageService.list()
    );
  })
};
