import type { FaultReport } from "../types/FaultReport";
import { request } from "../utils/http";

const endpoint = "/api/fault-report";

export async function listFaultReport(): Promise<FaultReport[]> {
  return request<FaultReport[]>(endpoint);
}

export async function getFaultReport(id: number): Promise<FaultReport> {
  return request<FaultReport>(`${endpoint}/${id}`);
}
