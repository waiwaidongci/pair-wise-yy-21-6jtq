import type { GridAsset } from "../types/GridAsset";

export const createDefaultGridAsset = (overrides: Partial<GridAsset> = {}): GridAsset => ({
  id: 0,
  asset_code: "",
  asset_type: "OUTAGE",
  feeder_line: "",
  voltage_level: "10kV",
  location_desc: "",
  health_status: "NORMAL",
  baseline_health_status: "NORMAL",
  owner_team_id: null,
  ...overrides
});

export const createGridAssetForm = createDefaultGridAsset;
export const createGridAssetResponse = createDefaultGridAsset;
