import type { Request, Response } from "express";
import { crewService } from "../services/CrewService";
import { asyncHandler } from "../utils/asyncHandler";

export const crewController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await crewService.list());
  }),
  detail: asyncHandler(async (req: Request, res: Response) => {
    res.json(await crewService.detail(Number(req.params.id)));
  })
};
