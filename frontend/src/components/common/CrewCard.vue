<script setup lang="ts">
import { computed } from "vue";
import type { Crew } from "../../types/Crew";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{ crew: Crew }>();

const currentTicketText = computed(() =>
  props.crew.current_ticket_id === null ? "无在途工单" : `当前在途工单 #${props.crew.current_ticket_id}`
);
</script>

<template>
  <div class="shared-widget crew-card">
    <div class="crew-head">
      <strong>{{ crew.name }}</strong>
      <StatusBadge :value="crew.duty_status" kind="crew" />
    </div>
    <p class="muted">{{ currentTicketText }}</p>
    <p class="muted small">技能：{{ crew.skill_tags }} · {{ crew.contact_phone }}</p>
  </div>
</template>
