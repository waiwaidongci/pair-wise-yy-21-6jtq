import type { Request, Response } from "express";
import { gridAssetService } from "../services/GridAssetService";

export const gridAssetController = {
  list: (_req: Request, res: Response) => {
    res.json(gridAssetService.list());
  },
  get: (req: Request, res: Response) => {
    const asset = gridAssetService.get(req.params.id);
    if (!asset) return res.status(404).json({ code: "ASSET_NOT_FOUND", message: "配网资产不存在" });
    res.json(asset);
  },
  create: (req: Request, res: Response) => {
    res.status(201).json(gridAssetService.create(req.body));
  },
};
