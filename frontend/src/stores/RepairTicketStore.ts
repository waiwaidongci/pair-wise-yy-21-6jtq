import { defineStore } from "pinia";
import { listRepairTicket, restoreRepairTicket } from "../api/RepairTicket";
import type { RepairTicket } from "../types/RepairTicket";
import type { RestoreResponse } from "../types/Restore";
import { createRestoreRequestId } from "../utils/http";

interface RepairTicketState {
  rows: RepairTicket[];
  loading: boolean;
  restoring: boolean;
  restoringTicketId: number | null;
  /** 每张工单最近一次复电结果（四件套同一份依据） */
  lastResultByTicket: Record<number, RestoreResponse>;
  /** 最近一次冲突原因（后到调度员可见） */
  conflictReason: string | null;
}

export const useRepairTicketStore = defineStore("repairTicket", {
  state: (): RepairTicketState => ({
    rows: [],
    loading: false,
    restoring: false,
    restoringTicketId: null,
    lastResultByTicket: {},
    conflictReason: null
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
     * 复电确认：默认生成幂等键；同一动作重试可传入相同 requestId。
     * 冲突不抛异常，统一由返回值的 kind 表达，让页面展示“当前状态 + 冲突原因”。
     */
    async restore(ticketId: number, requestId?: string): Promise<RestoreResponse> {
      this.restoring = true;
      this.restoringTicketId = ticketId;
      this.conflictReason = null;
      try {
        const result = await restoreRepairTicket(ticketId, {
          requestId: requestId ?? createRestoreRequestId(ticketId)
        });
        this.lastResultByTicket[ticketId] = result;
        if (result.kind === "CONFLICT") {
          this.conflictReason = result.conflict?.reason ?? "复电结果已由他人先确认";
        }
        // 用服务端返回的当前状态直接刷新该工单，避免后到者用旧数据覆盖视图
        const index = this.rows.findIndex((row) => row.id === ticketId);
        if (index >= 0) this.rows[index] = result.outcome.ticket;
        return result;
      } finally {
        this.restoring = false;
        this.restoringTicketId = null;
      }
    }
  }
});
