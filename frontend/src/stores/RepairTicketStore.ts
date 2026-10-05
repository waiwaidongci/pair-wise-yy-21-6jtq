import { defineStore } from "pinia";
import { listRepairTicket, restoreRepairTicket, type RestoreResult } from "../api/RepairTicket";
import type { RepairTicket } from "../types/RepairTicket";

interface RestoreFeedback {
  type: "success" | "conflict" | "error";
  message: string;
  conflict?: { current_status: string; conflict_reason: string };
}

export const useRepairTicketStore = defineStore("repairTicket", {
  state: () => ({
    rows: [] as RepairTicket[],
    loading: false,
    restoringId: null as number | null,
    feedback: null as RestoreFeedback | null,
  }),
  actions: {
    async load() {
      this.loading = true;
      try {
        this.rows = await listRepairTicket();
      } finally {
        this.loading = false;
      }
    },
    /**
     * Confirm restoration. Updates the local ticket row from the response and
     * records feedback (success / conflict with current status + reason).
     */
    async restore(ticket: RepairTicket): Promise<RestoreResult | null> {
      this.restoringId = ticket.id;
      this.feedback = null;
      try {
        const key = `restore-${ticket.id}-${Date.now()}`;
        const result = await restoreRepairTicket(ticket.id, {
          idempotency_key: key,
          expected_version: ticket.version,
        });
        const idx = this.rows.findIndex((row) => row.id === ticket.id);
        if (idx !== -1 && result.ticket) {
          this.rows[idx] = result.ticket;
        }
        if (result.idempotent) {
          this.feedback = { type: "success", message: "该工单已复电，沿用首次结果" };
        } else {
          this.feedback = {
            type: "success",
            message: `复电成功：资产 ${result.asset?.health_status ?? "—"}，班组 ${
              result.crew ? "已释放" : "未释放"
            }`,
          };
        }
        return result;
      } catch (err) {
        const conflict = (err as { conflict?: { current_status: string; conflict_reason: string } })
          .conflict;
        if (conflict) {
          this.feedback = {
            type: "conflict",
            message: `复电冲突：当前状态为 ${conflict.current_status}`,
            conflict: {
              current_status: conflict.current_status,
              conflict_reason: conflict.conflict_reason,
            },
          };
        } else {
          this.feedback = { type: "error", message: (err as Error).message };
        }
        return null;
      } finally {
        this.restoringId = null;
      }
    },
    clearFeedback() {
      this.feedback = null;
    },
  },
});
