import type { Request, Response } from "express";
import { faultReportService } from "../services/FaultReportService";

export const faultReportController = {
  list: (_req: Request, res: Response) => {
    res.json(faultReportService.list());
  },
  get: (req: Request, res: Response) => {
    const report = faultReportService.get(req.params.id);
    if (!report) return res.status(404).json({ code: "FAULT_REPORT_NOT_FOUND", message: "故障报修不存在" });
    res.json(report);
  },
  create: (req: Request, res: Response) => {
    res.status(201).json(faultReportService.create(req.body));
  },
};
