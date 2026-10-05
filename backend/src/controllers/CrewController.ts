import type { Request, Response } from "express";
import { crewService } from "../services/CrewService";

export const crewController = {
  list: (_req: Request, res: Response) => {
    res.json(crewService.list());
  },
  get: (req: Request, res: Response) => {
    const crew = crewService.get(req.params.id);
    if (!crew) return res.status(404).json({ code: "CREW_NOT_FOUND", message: "抢修班组不存在" });
    res.json(crew);
  },
  create: (req: Request, res: Response) => {
    res.status(201).json(crewService.create(req.body));
  },
};
