<script setup lang="ts">
import { onMounted, ref } from "vue";
import { listGridAsset } from "../api/GridAsset";
import type { GridAsset } from "../types/GridAsset";
import StatusBadge from "../components/common/StatusBadge.vue";

const rows = ref<GridAsset[]>([]);
const loading = ref(true);
const load = async () => {
  loading.value = true;
  try {
    rows.value = await listGridAsset();
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>

<template>
  <section>
    <header class="page-toolbar">
      <h2>配网资产健康状态</h2>
      <button class="btn" :disabled="loading" @click="load">刷新</button>
    </header>
    <p class="muted">健康状态只在该资产关联的抢修工单全部复电后恢复到基准档位。</p>
    <div v-if="loading" class="muted">加载中…</div>
    <table v-else class="panel" style="width: 100%; border-collapse: collapse">
      <thead>
        <tr>
          <th align="left">资产编码</th><th align="left">馈线</th><th align="left">位置</th>
          <th align="left">当前状态</th><th align="left">基准档位</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="asset in rows" :key="asset.id">
          <td>{{ asset.asset_code }}</td>
          <td>{{ asset.feeder_line }}</td>
          <td>{{ asset.location_desc }}</td>
          <td><StatusBadge :value="asset.health_status" kind="asset" /></td>
          <td><StatusBadge :value="asset.baseline_health_status" kind="asset" /></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
