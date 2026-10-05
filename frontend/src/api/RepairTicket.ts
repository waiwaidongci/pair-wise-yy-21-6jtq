import type { RepairTicket } from "../types/RepairTicket";
import type { RestorePayload, RestoreResponse } from "../types/Restore";
import { request } from "../utils/http";

const endpoint = "/api/repair-ticket";

export async function listRepairTicket(): Promise<RepairTicket[]> {
  return request<RepairTicket[]>(endpoint);
}

export async function getRepairTicket(id: number): Promise<RepairTicket> {
  return request<RepairTicket>(`${endpoint}/${id}`);
}

/**
 * 复电确认：
 * - 同一 requestId 重复请求沿用首次结果；
 * - 两名调度员并发时，后端返回 409 + kind=CONFLICT（当前状态 + 冲突原因）。
 */
export async function restoreRepairTicket(
  id: number,
  payload: RestorePayload
): Promise<RestoreResponse> {
  return request<RestoreResponse>(`${endpoint}/${id}/restore`, {
    method: "POST",
    body: payload
  });
}

export async function saveRepairTicket(payload: RepairTicket) {
  return request<RepairTicket>(endpoint, { method: "POST", body: payload });
}
