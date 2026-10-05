import { store } from "../store";
import type { EntityRow } from "../store/JsonStore";

export const gridAssetRepository = {
  findAll: (): EntityRow[] => store.all("gridAsset"),

  findById: (id: number | string): EntityRow | undefined => store.findById("gridAsset", id),

  insert: (row: EntityRow): EntityRow => store.insert("gridAsset", row),

  update: (
    id: number | string,
    patch: EntityRow,
    expectedVersion?: number
  ): EntityRow => store.update("gridAsset", id, patch, { expectedVersion }),
};
