import type { Request, Response } from "express";
import { faultReportService } from "../services/FaultReportService";
import { asyncHandler } from "../utils/asyncHandler";

export const faultReportController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await faultReportService.list());
  }),
  detail: asyncHandler(async (req: Request, res: Response) => {
    res.json(await faultReportService.detail(Number(req.params.id)));
  })
};
