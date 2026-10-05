import type { GridAsset } from "../models/GridAsset";

export const createGridAssetDto = (overrides: Partial<GridAsset> = {}): GridAsset => ({
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
