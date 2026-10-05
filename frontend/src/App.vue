<script setup lang="ts">
import { computed, ref } from "vue";
import { routes } from "./router/routes";
import StatusBadge from "./components/common/StatusBadge.vue";
import TicketsPage from "./pages/TicketsPage.vue";
import AssetsPage from "./pages/AssetsPage.vue";
import FaultsPage from "./pages/FaultsPage.vue";
import DashboardPage from "./pages/DashboardPage.vue";
import PartsPage from "./pages/PartsPage.vue";

const active = ref<string>("/tickets");
const current = computed(() => routes.find((route) => route.route === active.value) ?? routes[0]);
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand">电力配网抢修工单系统</div>
      <nav>
        <button
          v-for="route in routes"
          :key="route.route"
          :class="{ active: active === route.route }"
          @click="active = route.route"
        >
          {{ route.name }}
        </button>
      </nav>
    </aside>
    <main class="page">
      <section class="page-head">
        <div>
          <p class="eyebrow">grid-repair</p>
          <h1>{{ current?.name }}</h1>
        </div>
        <StatusBadge value="REPAIRING" kind="ticket" />
      </section>
      <TicketsPage v-if="active === '/tickets'" />
      <AssetsPage v-else-if="active === '/assets'" />
      <FaultsPage v-else-if="active === '/faults'" />
      <DashboardPage v-else-if="active === '/dashboard'" />
      <PartsPage v-else-if="active === '/parts'" />
    </main>
  </div>
</template>
