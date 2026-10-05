import type { Request, Response } from "express";
import { gridAssetService } from "../services/GridAssetService";
import { asyncHandler } from "../utils/asyncHandler";

export const gridAssetController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await gridAssetService.list());
  }),
  detail: asyncHandler(async (req: Request, res: Response) => {
    res.json(await gridAssetService.detail(Number(req.params.id)));
  })
};
