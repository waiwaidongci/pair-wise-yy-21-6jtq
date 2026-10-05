import { store } from "../store";
import type { EntityRow } from "../store/JsonStore";

export const faultReportRepository = {
  findAll: (): EntityRow[] => store.all("faultReport"),

  findById: (id: number | string): EntityRow | undefined => store.findById("faultReport", id),

  findByAsset: (assetId: number | string): EntityRow[] =>
    store
      .all("faultReport")
      .filter((report) => String(report.asset_id) === String(assetId)),

  insert: (row: EntityRow): EntityRow => store.insert("faultReport", row),

  update: (
    id: number | string,
    patch: EntityRow,
    expectedVersion?: number
  ): EntityRow => store.update("faultReport", id, patch, { expectedVersion }),
};
