import type { SparePartUsage } from "../types/SparePartUsage";
import { request } from "../utils/http";

const endpoint = "/api/spare-part-usage";

export async function listSparePartUsage(ticketId?: number): Promise<SparePartUsage[]> {
  return request<SparePartUsage[]>(ticketId ? `${endpoint}?ticketId=${ticketId}` : endpoint);
}
