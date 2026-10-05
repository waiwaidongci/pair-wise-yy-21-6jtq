import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { isRestorable } from "../constants/TicketStatus";
import type { RestoreResponse } from "../types/Restore";

/**
 * 工单复电流程：封装幂等确认、并发冲突展示与当前状态刷新。
 * 同一个 requestId 重试沿用首次结果；后到者只看到当前状态和冲突原因。
 */
export function useTicketFlow() {
  const store = useRepairTicketStore();
  const { rows, loading, restoring, restoringTicketId, conflictReason } = storeToRefs(store);

  const restorableRows = computed(() => rows.value.filter((row) => isRestorable(row.status)));
  const lastResultOf = (ticketId: number): RestoreResponse | undefined =>
    store.lastResultByTicket[ticketId];

  const confirmRestore = async (ticketId: number, requestId?: string) =>
    store.restore(ticketId, requestId);

  const reload = () => store.load();
  const page = ref(1);
  const pageSize = 8;
  const pageRows = computed(() =>
    rows.value.slice((page.value - 1) * pageSize, page.value * pageSize)
  );

  return {
    rows,
    pageRows,
    page,
    pageSize,
    total: computed(() => rows.value.length),
    loading,
    restoring,
    restoringTicketId,
    conflictReason,
    restorableRows,
    lastResultOf,
    confirmRestore,
    reload
  };
}
