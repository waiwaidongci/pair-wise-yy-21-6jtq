/** POST /api/repair-ticket/:id/restore */
export interface RestorePayload {
  /** 幂等键：同一复电动作重试必须带同一个 requestId；不传则由服务端生成 */
  requestId?: string;
  restoredAt?: string;
}
