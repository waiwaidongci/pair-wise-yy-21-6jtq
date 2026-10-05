import type { AssetHealthStatus } from "../constants/AssetHealthStatus";

export interface GridAsset {
  id: number;
  asset_code: string;
  asset_type: string;
  feeder_line: string;
  voltage_level: string;
  location_desc: string;
  health_status: AssetHealthStatus | string;
  /** 无在途工单时恢复到的健康档位 */
  baseline_health_status: AssetHealthStatus | string;
  owner_team_id: number | null;
}
