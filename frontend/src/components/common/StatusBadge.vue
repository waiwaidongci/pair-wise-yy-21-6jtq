<script setup lang="ts">
import { computed } from "vue";
import { AssetHealthStatusText } from "../../constants/AssetHealthStatus";
import { TicketStatusText } from "../../constants/TicketStatus";
import { CrewDutyStatusText } from "../../constants/CrewDutyStatus";
import { FaultReportStatusText } from "../../constants/FaultReportStatus";

const props = defineProps<{
  value: string;
  kind?: "ticket" | "asset" | "crew" | "fault";
}>();

const TEXT_MAPS = {
  ticket: TicketStatusText,
  asset: AssetHealthStatusText,
  crew: CrewDutyStatusText,
  fault: FaultReportStatusText
} as const;

const label = computed(() => {
  const map = props.kind ? TEXT_MAPS[props.kind] : undefined;
  return (map as Record<string, string> | undefined)?.[props.value] ?? props.value.replace(/_/g, " ");
});

const tone = computed(() => {
  if (props.kind === "ticket") {
    if (props.value === "RESTORED" || props.value === "CLOSED") return "ok";
    if (props.value === "WAIT_DISPATCH") return "muted";
    return "warn";
  }
  if (props.kind === "asset") {
    if (props.value === "NORMAL") return "ok";
    if (props.value === "DEGRADED") return "warn";
    if (props.value === "DANGEROUS") return "danger";
    return "muted";
  }
  if (props.kind === "crew") {
    return props.value === "ON_TASK" ? "warn" : "ok";
  }
  if (props.kind === "fault") return props.value === "RESOLVED" ? "ok" : "warn";
  return "muted";
});
</script>

<template>
  <span class="badge" :data-tone="tone">{{ label }}</span>
</template>
