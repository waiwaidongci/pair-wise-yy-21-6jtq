export const createGridAssetDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  asset_code: "GA-001",
  asset_type: "OUTAGE",
  feeder_line: "FEEDER-1",
  voltage_level: "10kV",
  location_desc: "location desc 1",
  health_status: "NORMAL",
  owner_team_id: 1,
  version: 1,
  ...overrides,
});
