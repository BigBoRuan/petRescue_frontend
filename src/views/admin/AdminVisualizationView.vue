<template>
  <div class="viz-page">
    <a-typography-title :heading="4" style="margin-top: 0">救助与领养可视化</a-typography-title>
    <a-typography-paragraph v-if="subtitle" type="secondary" style="margin-bottom: 12px">
      {{ subtitle }}
    </a-typography-paragraph>

    <a-card v-if="isSuper" class="toolbar-card" style="margin-bottom: 16px">
      <a-space wrap>
        <span class="filter-label">数据范围</span>
        <a-select
          v-model="selectedHospitalId"
          allow-clear
          placeholder="全平台"
          style="min-width: 220px"
          :loading="hospitalsLoading"
          :options="hospitalOptions"
          @change="loadStats"
        />
        <a-button type="outline" :loading="loading" @click="loadStats">刷新</a-button>
      </a-space>
    </a-card>

    <a-spin :loading="loading" style="width: 100%">
      <a-row :gutter="16">
        <a-col :xs="24" :lg="8">
          <a-card title="领养状态" class="chart-card">
            <div ref="pieAdoptRef" class="chart-box" />
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card title="宠物种类" class="chart-card">
            <div ref="pieTypeRef" class="chart-box" />
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card title="救助上报进度" class="chart-card">
            <div ref="pieRescueRef" class="chart-box" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="趋势（按月：新建档案 / 完成领养）" class="chart-card">
            <div ref="lineRef" class="chart-box chart-box-wide" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="结构树（救助 → 档案 → 领养）" class="chart-card">
            <div ref="treeRef" class="chart-box chart-tree" />
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
/**
 * 使用 UMD 构建（dist/echarts.js），避免：
 * 1) 部分环境下包内 index.js 未安装完整导致 ENOENT
 * 2) echarts.esm.js 在 Vue CLI / Webpack 中需额外 loader 才能解析
 */
import * as echarts from 'echarts/dist/echarts.js';
import * as petApi from '@/api/petApi';
import * as userApi from '@/api/userApi';
import { useUserStore } from '@/stores/user';
import { ROLE } from '@/constants/roles';

const userStore = useUserStore();
const isSuper = computed(() => userStore.user?.role === ROLE.SUPER_ADMIN);

const loading = ref(false);
const hospitalsLoading = ref(false);
const stats = ref(null);
const selectedHospitalId = ref(undefined);

const hospitalOptions = ref([]);

const subtitle = computed(() => stats.value?.scopeTitle || '');

const pieAdoptRef = ref(null);
const pieTypeRef = ref(null);
const pieRescueRef = ref(null);
const lineRef = ref(null);
const treeRef = ref(null);

/** @type {ReturnType<typeof echarts.init>[]} */
const chartInstances = [];

const NAME_COLOR = {
  已领养: '#3b82f6', // 蓝
  已取消: '#f97316', // 橙（与已领养区分）
  已救助: '#22c55e', // 绿
  待处理: '#a855f7', // 紫
  待领养: '#10b981', // 青绿
  领养中: '#10b981',
  已归档: '#64748b', // 灰蓝
};

function pieOption(title, items) {
  const raw = (items || []).map((i) => ({
    name: i.name,
    value: Number(i.value) || 0,
    itemStyle: NAME_COLOR[i.name] ? { color: NAME_COLOR[i.name] } : undefined,
  }));
  // ECharts 饼图在大量 0 值时观感怪异（仍占 legend/tooltip），这里过滤 0 值。
  const data = raw.filter((d) => d.value > 0);
  return {
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        if (!p || p.name === '暂无数据') return '暂无数据';
        return `${p.name}: ${p.value} (${p.percent}%)`;
      },
    },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['36%', '62%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: (p) => (p.name === '暂无数据' ? '暂无数据' : p.name) },
        data: data.length ? data : [{ name: '暂无数据', value: 1 }],
      },
    ],
  };
}

function lineOption(trend) {
  const months = (trend || []).map((t) => t.month);
  const archives = (trend || []).map((t) => Number(t.archiveCount) || 0);
  const adopts = (trend || []).map((t) => Number(t.adoptCount) || 0);
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新建档案', '完成领养'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: months },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '新建档案',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: archives,
        itemStyle: { color: '#22c55e' },
        lineStyle: { width: 3 },
      },
      {
        name: '完成领养',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: adopts,
        itemStyle: { color: NAME_COLOR.已领养 },
        lineStyle: { width: 3 },
      },
    ],
  };
}

function treeOption(root) {
  const data = root ? [root] : [{ name: '暂无数据', value: 0 }];
  return {
    tooltip: { trigger: 'item', formatter: (p) => (p.value != null ? `${p.name}: ${p.value}` : p.name) },
    series: [
      {
        type: 'tree',
        data,
        top: '2%',
        left: '8%',
        bottom: '2%',
        right: '18%',
        symbol: 'emptyCircle',
        symbolSize: 10,
        orient: 'LR',
        expandAndCollapse: true,
        initialTreeDepth: 4,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 12,
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
          },
        },
        animationDurationUpdate: 550,
      },
    ],
  };
}

function mountChart(el, option) {
  if (!el) return null;
  const c = echarts.init(el);
  c.setOption(option);
  chartInstances.push(c);
  return c;
}

function disposeCharts() {
  chartInstances.splice(0).forEach((c) => {
    try {
      c.dispose();
    } catch {
      /* ignore */
    }
  });
}

function renderCharts(vo) {
  disposeCharts();
  nextTick(() => {
    mountChart(pieAdoptRef.value, pieOption('领养状态', vo?.adoptStatusPie));
    mountChart(pieTypeRef.value, pieOption('宠物种类', vo?.petTypePie));
    mountChart(pieRescueRef.value, pieOption('救助上报', vo?.rescueReportPie));
    mountChart(lineRef.value, lineOption(vo?.monthlyTrend));
    mountChart(treeRef.value, treeOption(vo?.treeRoot));
  });
}

async function loadHospitals() {
  if (!isSuper.value) return;
  hospitalsLoading.value = true;
  try {
    const page = await userApi.listHospitalPage({ current: 1, pageSize: 500 });
    const records = page?.records || [];
    hospitalOptions.value = records.map((h) => ({
      label: h.hospitalName || `医院 #${h.id}`,
      value: h.id,
    }));
  } catch {
    hospitalOptions.value = [];
  } finally {
    hospitalsLoading.value = false;
  }
}

async function loadStats() {
  loading.value = true;
  try {
    const params = {};
    if (isSuper.value && selectedHospitalId.value != null) {
      params.hospitalId = selectedHospitalId.value;
    }
    const vo = await petApi.petStatsVisualization(params);
    stats.value = vo;
    renderCharts(vo);
  } catch {
    stats.value = null;
    disposeCharts();
  } finally {
    loading.value = false;
  }
}

function onResize() {
  chartInstances.forEach((c) => c.resize());
}

onMounted(async () => {
  await loadHospitals();
  await loadStats();
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  disposeCharts();
});
</script>

<style scoped>
.viz-page {
  max-width: 1400px;
}
.toolbar-card {
  border-radius: 12px;
  border: 1px solid var(--bili-line, #e8e8ef);
}
.filter-label {
  color: var(--bili-muted, #6b6b6b);
  font-size: 13px;
}
.chart-card {
  border-radius: 12px;
  border: 1px solid var(--bili-line, #e8e8ef);
  margin-bottom: 0;
}
.chart-card :deep(.arco-card-body) {
  padding-top: 8px;
}
.chart-box {
  width: 100%;
  height: 280px;
}
.chart-box-wide {
  height: 320px;
}
.chart-tree {
  height: 420px;
}
</style>
