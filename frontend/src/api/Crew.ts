import type { Crew } from "../types/Crew";
import { request } from "../utils/http";

const endpoint = "/api/crew";

export async function listCrew(): Promise<Crew[]> {
  return request<Crew[]>(endpoint);
}

export async function getCrew(id: number): Promise<Crew> {
  return request<Crew>(`${endpoint}/${id}`);
}
