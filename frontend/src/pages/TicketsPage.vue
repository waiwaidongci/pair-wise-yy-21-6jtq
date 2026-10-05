<script setup lang="ts">
import { onMounted } from "vue";
import { useTicketFlow } from "../hooks/useTicketFlow";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { isRestorable } from "../constants/TicketStatus";
import { RESTORE_RESULT_TEXT } from "../constants/errorCodes";
import { formatDate } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge.vue";
import CrewCard from "../components/common/CrewCard.vue";
import type { RestoreResponse } from "../types/Restore";

const { rows, loading, restoring, restoringTicketId, conflictReason, confirmRestore, reload } =
  useTicketFlow();

// 四件套最近处置结果由 store 持有；后到者从这里看到“当前状态 + 冲突原因”
const ticketStore = useRepairTicketStore();
const outcomeOf = (ticketId: number): RestoreResponse | undefined =>
  ticketStore.lastResultByTicket[ticketId];

onMounted(reload);

const onRestore = async (ticketId: number) => {
  await confirmRestore(ticketId);
};
</script>

<template>
  <section class="tickets-page">
    <header class="page-toolbar">
      <div>
        <h2>抢修工单 · 复电确认</h2>
        <p class="muted">
          资产只在关联工单全部复电后恢复正常；班组仅由当前在途工单释放；
          重复请求沿用首次结果，并发确认先到者生效。
        </p>
      </div>
      <button class="btn" :disabled="loading" @click="reload">刷新</button>
    </header>

    <div v-if="conflictReason" class="alert conflict">
      <strong>{{ RESTORE_RESULT_TEXT.CONFLICT }}</strong>
      <p>{{ conflictReason }}</p>
    </div>

    <div v-if="loading" class="muted">加载中…</div>

    <div v-else class="ticket-list">
      <article v-for="ticket in rows" :key="ticket.id" class="ticket-card panel">
        <div class="ticket-head">
          <div>
            <strong class="ticket-id">工单 #{{ ticket.id }}</strong>
            <StatusBadge class="ml8" :value="ticket.status" kind="ticket" />
          </div>
          <div class="muted small">
            优先级 {{ ticket.priority }} · 班组 #{{ ticket.team_id }} · 报修 #{{ ticket.fault_report_id }}
          </div>
        </div>

        <dl class="ticket-meta">
          <div><dt>派工时间</dt><dd>{{ ticket.assigned_at ? formatDate(ticket.assigned_at) : "—" }}</dd></div>
          <div><dt>复电时间</dt><dd>{{ ticket.restored_at ? formatDate(ticket.restored_at) : "—" }}</dd></div>
          <div><dt>首次确认调度员</dt><dd>{{ ticket.restored_by ?? "—" }}</dd></div>
          <div><dt>版本号</dt><dd>v{{ ticket.version }}</dd></div>
        </dl>

        <div v-if="outcomeOf(ticket.id)" class="restore-result">
          <template v-if="outcomeOf(ticket.id)!.kind === 'RESTORED'">
            <p class="ok-text">✓ {{ RESTORE_RESULT_TEXT.RESTORED }}</p>
          </template>
          <template v-else>
            <p class="conflict-text">⚠ {{ RESTORE_RESULT_TEXT.CONFLICT }}</p>
            <p class="muted small">{{ outcomeOf(ticket.id)!.conflict?.reason }}</p>
          </template>
          <ul class="outcome-line">
            <li>
              资产：{{ outcomeOf(ticket.id)!.outcome.asset.asset_code }}
              <StatusBadge :value="outcomeOf(ticket.id)!.outcome.asset.health_status" kind="asset" />
            </li>
            <li>
              报修 #{{ outcomeOf(ticket.id)!.outcome.faultReport.id }}：
              <StatusBadge :value="outcomeOf(ticket.id)!.outcome.faultReport.status" kind="fault" />
            </li>
            <li v-if="outcomeOf(ticket.id)!.outcome.crew">
              <CrewCard :crew="outcomeOf(ticket.id)!.outcome.crew!" />
            </li>
            <li class="muted small">
              仍在途工单：{{ outcomeOf(ticket.id)!.outcome.activeTicketIds.length
                ? outcomeOf(ticket.id)!.outcome.activeTicketIds.join("、")
                : "无（资产可恢复基准档位）" }}
            </li>
          </ul>
        </div>

        <footer class="ticket-actions">
          <button
            class="btn primary"
            :disabled="!isRestorable(ticket.status) || restoring"
            @click="onRestore(ticket.id)"
          >
            <template v-if="restoringTicketId === ticket.id">确认中…</template>
            <template v-else>确认复电</template>
          </button>
          <span v-if="!isRestorable(ticket.status)" class="muted small">当前状态不可复电</span>
        </footer>
      </article>
    </div>
  </section>
</template>
