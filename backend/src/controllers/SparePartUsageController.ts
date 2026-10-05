import type { Request, Response } from "express";
import { sparePartUsageService } from "../services/SparePartUsageService";

export const sparePartUsageController = {
  list: (_req: Request, res: Response) => {
    res.json(sparePartUsageService.list());
  },
  get: (req: Request, res: Response) => {
    const usage = sparePartUsageService.get(req.params.id);
    if (!usage) return res.status(404).json({ code: "SPARE_PART_USAGE_NOT_FOUND", message: "备件领用记录不存在" });
    res.json(usage);
  },
  create: (req: Request, res: Response) => {
    res.status(201).json(sparePartUsageService.create(req.body));
  },
};
