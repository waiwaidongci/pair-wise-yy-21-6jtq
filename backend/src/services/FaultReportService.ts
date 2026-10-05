import { faultReportRepository } from "../repositories/FaultReportRepository";
import type { EntityRow } from "../store/JsonStore";

export const faultReportService = {
  list: (): EntityRow[] => faultReportRepository.findAll(),
  get: (id: number | string): EntityRow | undefined => faultReportRepository.findById(id),
  create: (row: unknown): EntityRow => faultReportRepository.insert(row as EntityRow),
};
