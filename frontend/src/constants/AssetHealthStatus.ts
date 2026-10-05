export const AssetHealthStatus = ["NORMAL","WATCH","DEGRADED","DANGEROUS"] as const;
export type AssetHealthStatus = (typeof AssetHealthStatus)[number];
export const AssetHealthStatusText: Record<AssetHealthStatus, string> = {
  NORMAL: "正常",
  WATCH: "关注",
  DEGRADED: "劣化",
  DANGEROUS: "危急"
};
