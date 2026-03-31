<template>
  <div class="bili-adopt">
    <section class="hero-carousel-wrap">
      <a-carousel
        class="hero-carousel"
        :auto-play="{ interval: 3000, hoverToPause: true }"
        animation-name="fade"
        indicator-type="dot"
        show-arrow="hover"
      >
        <a-carousel-item v-for="(slide, idx) in heroSlides" :key="idx">
          <div class="hero-slide">
            <img
              class="hero-slide-img"
              :src="slide.image"
              :alt="slide.title"
              loading="eager"
              :style="{ objectPosition: slide.objectPosition || 'center center' }"
            />
            <div class="hero-overlay">
              <p class="hero-kicker">领养中心</p>
              <h1 class="hero-title">{{ slide.title }}</h1>
              <p class="hero-desc">{{ slide.subtitle }}</p>
            </div>
          </div>
        </a-carousel-item>
      </a-carousel>
    </section>

    <div class="layout-split">
      <div class="layout-main">
        <section class="toolbar-panel">
          <div class="toolbar-row">
            <div class="toolbar-cell toolbar-cell--search">
              <span class="toolbar-label">搜索</span>
              <a-input-search
                v-model="keyword"
                class="toolbar-search-input"
                allow-clear
                placeholder="名称、种类（如猫）、健康或性格…"
                search-button
                @search="onSearch"
                @press-enter="onSearch"
              />
            </div>
            <div class="toolbar-cell toolbar-cell--region">
              <span class="toolbar-label">地区</span>
              <HospitalRegionAddress v-model="filters.regionPrefix" :show-preview="false" />
            </div>
            <div class="toolbar-cell toolbar-cell--compact">
              <span class="toolbar-label">年龄</span>
              <a-select
                v-model="filters.ageRange"
                allow-clear
                placeholder="不限"
                :options="ageRangeOptions"
                class="toolbar-select"
              />
            </div>
            <div class="toolbar-cell toolbar-cell--compact">
              <span class="toolbar-label">性别</span>
              <a-select
                v-model="filters.gender"
                allow-clear
                placeholder="不限"
                :options="genderOptions"
                class="toolbar-select"
              />
            </div>
            <div class="toolbar-actions">
              <a-button type="primary" class="bili-primary" @click="onSearch">查询</a-button>
              <a-button @click="onResetFilters">重置</a-button>
            </div>
          </div>
          <p class="toolbar-hint">
            支持模糊搜索；默认按最新上架排序。地区与救助「发现地点」或已通过审核的医院地址前缀匹配（满足其一即可）。
          </p>
        </section>

        <a-spin :loading="loading" class="spin-full">
          <div v-if="!loading && items.length === 0" class="empty-hint">
            <p>暂无符合条件的宠物，换个关键词或筛选试试～</p>
          </div>
          <div v-else class="card-grid">
            <PetAdoptCard v-for="p in items" :key="p.id" :pet="p" />
          </div>
        </a-spin>

        <div v-if="total > pageSize" class="pager">
          <a-pagination
            :total="total"
            :current="current"
            :page-size="pageSize"
            show-total
            @change="onPageChange"
          />
        </div>
      </div>

      <aside class="layout-side">
        <div class="side-card">
          <h2 class="side-title">合作医院榜</h2>
          <p class="side-desc">当前可领养宠物数量排名（最多 5 家）</p>
          <ol v-if="rankList.length" class="rank-list">
            <li v-for="(h, i) in rankList" :key="h.hospitalId" class="rank-item">
              <router-link
                class="rank-link"
                :to="{ name: 'PetHospitalPublic', params: { hospitalId: String(h.hospitalId) } }"
              >
                <span class="rank-num" :class="{ 'rank-num--top': i < 3 }">{{ i + 1 }}</span>
                <img
                  v-if="h.coverImageUrl"
                  class="rank-cover"
                  :src="publicFileUrl(h.coverImageUrl)"
                  alt=""
                />
                <span class="rank-name">{{ h.hospitalName || '医院' }}</span>
                <span class="rank-count">{{ h.adoptablePetCount }} 只</span>
              </router-link>
            </li>
          </ol>
          <p v-else class="side-empty">目前还没有足够的合作医院数据。</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import * as petApi from '@/api/petApi';
import { ADOPT_HERO_SLIDES } from '@/image/adoptHeroSlides.js';
import HospitalRegionAddress from '@/components/HospitalRegionAddress.vue';
import PetAdoptCard from '@/components/pets/PetAdoptCard.vue';
import { publicFileUrl } from '@/utils/publicAssetUrl';

const heroSlides = ADOPT_HERO_SLIDES;

const loading = ref(true);
const items = ref([]);
const rankList = ref([]);
const total = ref(0);
const current = ref(1);
const pageSize = ref(12);
const keyword = ref('');

const filters = reactive({
  regionPrefix: '',
  ageRange: '',
  gender: '',
});

const ageRangeOptions = [
  { label: '1 岁及以下', value: '0-1' },
  { label: '2～5 岁', value: '2-5' },
  { label: '6 岁及以上', value: '6+' },
];

const genderOptions = [
  { label: '公', value: '公' },
  { label: '母', value: '母' },
];

function buildListPayload() {
  const body = {
    current: current.value,
    pageSize: pageSize.value,
  };
  const k = (keyword.value || '').trim();
  if (k) body.keyword = k;
  const rp = (filters.regionPrefix || '').trim();
  if (rp) body.regionPrefix = rp;
  const ar = (filters.ageRange || '').trim();
  if (ar === '0-1') {
    body.minAge = 0;
    body.maxAge = 1;
  } else if (ar === '2-5') {
    body.minAge = 2;
    body.maxAge = 5;
  } else if (ar === '6+') {
    body.minAge = 6;
  }
  const g = (filters.gender || '').trim();
  if (g) body.gender = g;
  return body;
}

async function load() {
  loading.value = true;
  try {
    const page = await petApi.adoptList(buildListPayload());
    items.value = page.records || [];
    total.value = page.total ?? 0;
  } finally {
    loading.value = false;
  }
}

async function loadRank() {
  try {
    const list = await petApi.adoptHospitalRank(5);
    rankList.value = Array.isArray(list) ? list : [];
  } catch {
    rankList.value = [];
  }
}

function onSearch() {
  current.value = 1;
  load();
}

function onResetFilters() {
  keyword.value = '';
  filters.regionPrefix = '';
  filters.ageRange = '';
  filters.gender = '';
  current.value = 1;
  load();
}

function onPageChange(p) {
  current.value = p;
  load();
}

onMounted(() => {
  load();
  loadRank();
});
</script>

<style scoped>
.bili-adopt {
  animation: fade-in 0.35s ease;
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.hero-carousel-wrap {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(45, 45, 68, 0.12);
}
/* a-carousel 根节点同时带 .arco-carousel 与 .hero-carousel，不能用「.hero-carousel 内的 .arco-carousel」设高 */
.hero-carousel-wrap :deep(.arco-carousel) {
  width: 100%;
  height: 220px;
  min-height: 220px;
  border-radius: 12px;
  overflow: hidden;
}
@media (min-width: 768px) {
  .hero-carousel-wrap :deep(.arco-carousel) {
    height: 280px;
    min-height: 280px;
  }
}
.hero-carousel-wrap :deep(.arco-carousel-arrow > div) {
  background: rgba(255, 255, 255, 0.85);
  color: var(--bili-pink);
}
.hero-carousel-wrap :deep(.arco-carousel-indicator-item-active::after) {
  background: var(--bili-pink);
}
.hero-slide {
  position: relative;
  height: 100%;
  min-height: 220px;
  box-sizing: border-box;
  overflow: hidden;
  background: #2a2838;
}
@media (min-width: 768px) {
  .hero-slide {
    min-height: 280px;
  }
}
.hero-slide-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  /* 默认略放大，由父级 overflow:hidden 裁切，保证视区内始终被图铺满、无黑边 */
  transform: scale(1.08);
  transform-origin: center center;
  display: block;
  z-index: 0;
  filter: blur(10px);
  transition:
    filter 0.5s ease,
    transform 0.45s ease;
}
/* 悬停：去模糊；缩回 scale(1)，视觉上略「变小」但仍 cover 满屏，不出现黑框 */
.hero-slide:hover .hero-slide-img {
  filter: blur(0);
  transform: scale(1);
}
.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px 28px;
  background: linear-gradient(
    105deg,
    rgba(35, 32, 48, 0.75) 0%,
    rgba(35, 32, 48, 0.45) 45%,
    rgba(35, 32, 48, 0.2) 100%
  );
  color: #fff;
  box-sizing: border-box;
}
.hero-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.88;
  color: #ffc8d9;
}
.hero-title {
  margin: 0 0 10px;
  max-width: 520px;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}
@media (min-width: 768px) {
  .hero-title {
    font-size: 24px;
  }
}
.hero-desc {
  margin: 0;
  max-width: 480px;
  font-size: 13px;
  line-height: 1.55;
  opacity: 0.95;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.2);
}
.layout-split {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.layout-main {
  flex: 1;
  min-width: 0;
}
.layout-side {
  width: 260px;
  flex-shrink: 0;
}
@media (max-width: 960px) {
  .layout-split {
    flex-direction: column;
  }
  .layout-side {
    width: 100%;
  }
  .toolbar-cell--search {
    flex: 1 1 100%;
    min-width: 100%;
  }
  .toolbar-cell--region {
    flex: 1 1 100%;
    min-width: 100%;
  }
  .toolbar-cell--compact {
    flex: 1 1 calc(50% - 8px);
    width: auto;
    min-width: 120px;
  }
  .toolbar-actions {
    flex: 1 1 100%;
    justify-content: flex-start;
  }
}
.toolbar-panel {
  background: #fff;
  border: 1px solid var(--bili-line);
  border-radius: 12px;
  padding: 12px 14px 10px;
  margin-bottom: 18px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 12px;
}
.toolbar-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.toolbar-label {
  font-size: 11px;
  color: var(--bili-muted);
  line-height: 1;
  white-space: nowrap;
}
.toolbar-cell--search {
  flex: 1 1 220px;
  min-width: 160px;
}
.toolbar-cell--region {
  flex: 1 1 200px;
  min-width: 168px;
}
.toolbar-cell--region :deep(.hospital-region-address),
.toolbar-cell--region :deep(.arco-cascader) {
  width: 100%;
}
.toolbar-cell--compact {
  flex: 0 0 108px;
  width: 108px;
}
.toolbar-select {
  width: 100%;
}
.toolbar-search-input :deep(.arco-input-wrapper) {
  border-radius: 8px;
  border: 1px solid var(--bili-line);
}
.toolbar-search-input :deep(.arco-input-append) {
  border-radius: 0 8px 8px 0;
  overflow: hidden;
}
.toolbar-search-input :deep(.arco-btn-primary) {
  background-color: var(--bili-pink) !important;
  border-color: var(--bili-pink) !important;
  border-radius: 0;
}
.toolbar-search-input :deep(.arco-btn-primary:not(.arco-btn-disabled):hover) {
  background-color: #ff85a8 !important;
  border-color: #ff85a8 !important;
}
.toolbar-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  flex: 0 0 auto;
  padding-bottom: 1px;
}
.toolbar-hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: #8a93a8;
  line-height: 1.45;
}
.spin-full {
  width: 100%;
  min-height: 120px;
}
.empty-hint {
  text-align: center;
  padding: 48px 16px;
  color: var(--bili-muted);
  font-size: 14px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.pager {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
.side-card {
  position: sticky;
  top: 16px;
  background: #fff;
  border: 1px solid var(--bili-line);
  border-radius: 12px;
  padding: 16px 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.side-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 800;
  color: var(--bili-text);
}
.side-desc {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--bili-muted);
  line-height: 1.4;
}
.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rank-item + .rank-item {
  border-top: 1px solid var(--bili-line);
}
.rank-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 4px;
  text-decoration: none;
  color: inherit;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.rank-link:hover {
  background: var(--bili-pink-soft);
}
.rank-num {
  flex: 0 0 22px;
  height: 22px;
  border-radius: 6px;
  background: #f0f1f5;
  color: #666;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rank-num--top {
  background: linear-gradient(135deg, #fb7299, #ff9eb5);
  color: #fff;
}
.rank-cover {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--bili-line);
}
.rank-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-count {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--bili-pink);
  font-weight: 600;
}
.side-empty {
  margin: 0;
  font-size: 13px;
  color: var(--bili-muted);
  line-height: 1.5;
}
</style>
