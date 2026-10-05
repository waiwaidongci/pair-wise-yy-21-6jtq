import type { GridAsset } from "../types/GridAsset";
import { request } from "../utils/http";

const endpoint = "/api/grid-asset";

export async function listGridAsset(): Promise<GridAsset[]> {
  return request<GridAsset[]>(endpoint);
}

export async function getGridAsset(id: number): Promise<GridAsset> {
  return request<GridAsset>(`${endpoint}/${id}`);
}
