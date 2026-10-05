<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useRepairTicketStore } from "../stores/RepairTicketStore";
import { TicketStatusText } from "../constants/TicketStatus";
import type { RepairTicket } from "../types/RepairTicket";

const store = useRepairTicketStore();
const { rows, loading, restoringId, feedback } = storeToRefs(store);

const RESTORABLE = ["ASSIGNED", "ARRIVED", "REPAIRING"];

const restorableTickets = computed(() =>
  rows.value.filter((ticket) => RESTORABLE.includes(ticket.status))
);
const restoredTickets = computed(() =>
  rows.value.filter((ticket) => !RESTORABLE.includes(ticket.status))
);

onMounted(() => {
  store.load();
});

function statusLabel(status: string): string {
  return TicketStatusText[status as keyof typeof TicketStatusText] ?? status;
}

function statusClass(status: string): string {
  if (status === "RESTORED" || status === "CLOSED") return "badge badge-ok";
  if (status === "REPAIRING" || status === "ARRIVED") return "badge badge-warn";
  return "badge";
}

async function onRestore(ticket: RepairTicket) {
  await store.restore(ticket);
}
</script>

<template>
  <section class="tickets-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">抢修工单 · 复电确认</p>
        <h1>抢修工单</h1>
      </div>
      <button class="btn" @click="store.load()">刷新</button>
    </header>

    <div v-if="feedback" class="feedback" :class="feedback.type">
      <strong>{{ feedback.message }}</strong>
      <span v-if="feedback.conflict" class="conflict-reason">
        冲突原因：{{ feedback.conflict.conflict_reason }}
      </span>
      <button class="link" @click="store.clearFeedback()">知道了</button>
    </div>

    <section class="panel">
      <h2>在途工单（{{ restorableTickets.length }}）</h2>
      <p v-if="loading" class="empty">加载中…</p>
      <p v-else-if="restorableTickets.length === 0" class="empty">暂无在途工单</p>
      <article v-for="ticket in restorableTickets" :key="ticket.id" class="row">
        <div class="ticket-main">
          <strong>工单 #{{ ticket.id }}</strong>
          <span class="muted">报修单 #{{ ticket.fault_report_id }} · 班组 #{{ ticket.team_id }}</span>
          <span class="muted">优先级 {{ ticket.priority }} · 版本 v{{ ticket.version }}</span>
        </div>
        <span :class="statusClass(ticket.status)">{{ statusLabel(ticket.status) }}</span>
        <button
          class="btn btn-primary"
          :disabled="restoringId === ticket.id"
          @click="onRestore(ticket)"
        >
          {{ restoringId === ticket.id ? "复电处理中…" : "复电确认" }}
        </button>
      </article>
    </section>

    <section class="panel">
      <h2>已完结工单（{{ restoredTickets.length }}）</h2>
      <p v-if="restoredTickets.length === 0" class="empty">暂无已完结工单</p>
      <article v-for="ticket in restoredTickets" :key="ticket.id" class="row">
        <div class="ticket-main">
          <strong>工单 #{{ ticket.id }}</strong>
          <span class="muted">报修单 #{{ ticket.fault_report_id }} · 班组 #{{ ticket.team_id }}</span>
          <span class="muted"
            >复电时间 {{ ticket.restored_at ? new Date(ticket.restored_at).toLocaleString("zh-CN") : "—" }}</span
          >
        </div>
        <span :class="statusClass(ticket.status)">{{ statusLabel(ticket.status) }}</span>
        <span class="muted">—</span>
      </article>
    </section>
  </section>
</template>

<style scoped>
.tickets-page {
  display: grid;
  gap: 18px;
}
.feedback {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #fbfaf4;
  border: 1px solid #d8d6c8;
}
.feedback.success {
  background: #e4efe4;
  border-color: #b8d8b8;
  color: #244b31;
}
.feedback.conflict {
  background: #fbe9e7;
  border-color: #e0b4ac;
  color: #7d2d20;
}
.feedback.error {
  background: #fbe9e7;
  border-color: #e0b4ac;
  color: #7d2d20;
}
.conflict-reason {
  font-size: 13px;
  opacity: 0.85;
}
.link {
  margin-left: auto;
  background: transparent;
  border: 0;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.ticket-main {
  display: grid;
  gap: 2px;
}
.muted {
  color: #596257;
  font-size: 13px;
}
.badge-ok {
  background: #e4efe4;
  color: #244b31;
}
.badge-warn {
  background: #fdf3d7;
  color: #7d4d18;
}
.btn {
  background: #f5f1e6;
  border: 1px solid #d8d6c8;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  color: #223126;
}
.btn-primary {
  background: #274335;
  color: #f5f1e6;
  border-color: #274335;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
