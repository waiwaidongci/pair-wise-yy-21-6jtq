import type { GridAsset } from "../../models/GridAsset";
import type { Ctx } from "./RepoContext";

/** 配网资产仓储端口 */
export interface IGridAssetRepository {
  findById(ctx: Ctx, id: number, forUpdate?: boolean): Promise<GridAsset | null>;
  findAll(ctx: Ctx): Promise<GridAsset[]>;
  save(ctx: Ctx, row: Omit<GridAsset, "id"> & { id?: number }): Promise<GridAsset>;
  updateHealth(
    ctx: Ctx,
    id: number,
    healthStatus: GridAsset["health_status"]
  ): Promise<GridAsset | null>;
}
