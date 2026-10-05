import { sparePartUsageRepository } from "../repositories/SparePartUsageRepository";
import type { EntityRow } from "../store/JsonStore";

export const sparePartUsageService = {
  list: (): EntityRow[] => sparePartUsageRepository.findAll(),
  get: (id: number | string): EntityRow | undefined => sparePartUsageRepository.findById(id),
  create: (row: unknown): EntityRow => sparePartUsageRepository.insert(row as EntityRow),
};
