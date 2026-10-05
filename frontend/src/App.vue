<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { routes } from "./router/routes";
import { mockData } from "./mocks/seedData";
import StatusBadge from "./components/common/StatusBadge.vue";
import StatCard from "./components/common/StatCard.vue";
import DashboardPage from "./pages/DashboardPage.vue";
import AssetsPage from "./pages/AssetsPage.vue";
import FaultsPage from "./pages/FaultsPage.vue";
import TicketsPage from "./pages/TicketsPage.vue";
import PartsPage from "./pages/PartsPage.vue";

const active = ref<string>(routes[0]?.route ?? "/dashboard");
const current = computed(() => routes.find((route) => route.route === active.value) ?? routes[0]);
const entries = Object.entries(mockData);

const pageComponents: Record<string, unknown> = {
  "/dashboard": DashboardPage,
  "/assets": AssetsPage,
  "/faults": FaultsPage,
  "/tickets": TicketsPage,
  "/parts": PartsPage,
};
const activePage = shallowRef(pageComponents[active.value]);
function switchRoute(route: string) {
  active.value = route;
  activePage.value = pageComponents[route];
}
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
          @click="switchRoute(route.route)"
        >
          {{ route.name }}
        </button>
      </nav>
    </aside>
    <main class="page">
      <component :is="activePage" />
      <section v-if="active === '/dashboard'" class="metrics">
        <StatCard label="核心模型" :value="entries.length" />
        <StatCard label="共享枚举" :value="3" />
        <StatCard
          label="本地记录"
          :value="entries.reduce((s, [, rows]) => s + rows.length, 0)"
        />
      </section>
      <section v-if="active === '/dashboard'" class="workbench">
        <div class="panel wide">
          <h2>业务数据</h2>
          <article class="row" v-for="[key, rows] in entries" :key="key">
            <strong>{{ key }}</strong>
            <span>{{ rows.length }} 条</span>
            <StatusBadge value="READY" />
          </article>
        </div>
        <div class="panel">
          <h2>联动检查</h2>
          <p>页面、store、API、构造器、日志模板和枚举常量均按提示词拆分。</p>
        </div>
      </section>
    </main>
  </div>
</template>
