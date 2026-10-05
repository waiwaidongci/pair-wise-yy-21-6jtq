export const AssetHealthStatus = ["NORMAL", "WATCH", "DEGRADED", "DANGEROUS"] as const;
export type AssetHealthStatus = (typeof AssetHealthStatus)[number];

/** 资产挂有在途工单时的默认劣化档位（复电前） */
export const ACTIVE_HEALTH_STATUS: AssetHealthStatus = "DEGRADED";
