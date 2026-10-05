import type { GridAsset } from "../../models/GridAsset";
import type { Ctx } from "../ports/RepoContext";
import type { IGridAssetRepository } from "../ports/IGridAssetRepository";
import { asMemory } from "../ports/RepoContext";

export class MemoryGridAssetRepository implements IGridAssetRepository {
  async findById(ctx: Ctx, id: number): Promise<GridAsset | null> {
    const row = asMemory(ctx).tables.gridAsset.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async findAll(ctx: Ctx): Promise<GridAsset[]> {
    return asMemory(ctx).tables.gridAsset.map((r) => ({ ...r }));
  }

  async save(ctx: Ctx, row: Omit<GridAsset, "id"> & { id?: number }): Promise<GridAsset> {
    const table = asMemory(ctx).tables.gridAsset;
    const id = row.id ?? table.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const saved: GridAsset = { ...(row as Omit<GridAsset, "id">), id };
    table.push(saved);
    return { ...saved };
  }

  async updateHealth(
    ctx: Ctx,
    id: number,
    healthStatus: GridAsset["health_status"]
  ): Promise<GridAsset | null> {
    const row = asMemory(ctx).tables.gridAsset.find((r) => r.id === id);
    if (!row) return null;
    row.health_status = healthStatus;
    return { ...row };
  }
}
