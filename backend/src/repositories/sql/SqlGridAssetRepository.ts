import type { GridAsset } from "../../models/GridAsset";
import type { Ctx } from "../ports/RepoContext";
import type { IGridAssetRepository } from "../ports/IGridAssetRepository";
import { num, nullableNum, str } from "./rowMappers";

const mapRow = (row: Record<string, unknown>): GridAsset => ({
  id: num(row.id),
  asset_code: str(row.asset_code),
  asset_type: str(row.asset_type),
  feeder_line: str(row.feeder_line),
  voltage_level: str(row.voltage_level),
  location_desc: str(row.location_desc),
  health_status: str(row.health_status, "NORMAL"),
  baseline_health_status: str(row.baseline_health_status, "NORMAL"),
  owner_team_id: nullableNum(row.owner_team_id)
});

const COLUMNS =
  "id, asset_code, asset_type, feeder_line, voltage_level, location_desc, health_status, baseline_health_status, owner_team_id";

export class SqlGridAssetRepository implements IGridAssetRepository {
  async findById(ctx: Ctx, id: number, forUpdate = false): Promise<GridAsset | null> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM grid_asset WHERE id = ?${forUpdate ? " FOR UPDATE" : ""}`,
      [id]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findAll(ctx: Ctx): Promise<GridAsset[]> {
    const rows = await ctx.client.query<Record<string, unknown>>(
      `SELECT ${COLUMNS} FROM grid_asset ORDER BY id`
    );
    return rows.map(mapRow);
  }

  async save(ctx: Ctx, row: Omit<GridAsset, "id"> & { id?: number }): Promise<GridAsset> {
    const result = await ctx.client.query<{ insertId: number }>(
      `INSERT INTO grid_asset (id, asset_code, asset_type, feeder_line, voltage_level, location_desc, health_status, baseline_health_status, owner_team_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id ?? null,
        row.asset_code,
        row.asset_type,
        row.feeder_line,
        row.voltage_level,
        row.location_desc,
        row.health_status,
        row.baseline_health_status,
        row.owner_team_id
      ]
    );
    return { ...row, id: row.id ?? result[0]?.insertId } as GridAsset;
  }

  async updateHealth(
    ctx: Ctx,
    id: number,
    healthStatus: GridAsset["health_status"]
  ): Promise<GridAsset | null> {
    await ctx.client.query(
      `UPDATE grid_asset SET health_status = ? WHERE id = ?`,
      [healthStatus, id]
    );
    return this.findById(ctx, id);
  }
}
