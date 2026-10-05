import { gridAssetRepository } from "../repositories/GridAssetRepository";
import type { EntityRow } from "../store/JsonStore";

export const gridAssetService = {
  list: (): EntityRow[] => gridAssetRepository.findAll(),
  get: (id: number | string): EntityRow | undefined => gridAssetRepository.findById(id),
  create: (row: unknown): EntityRow => gridAssetRepository.insert(row as EntityRow),
};
