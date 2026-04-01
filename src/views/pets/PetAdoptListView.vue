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
          <div class="hospital-search">
            <a-input-search
              v-model="hospitalKeyword"
              allow-clear
              size="small"
              placeholder="搜索医院名称/地址…"
              @search="onHospitalSearchOpen"
              @press-enter="onHospitalSearchOpen"
            />
          </div>
          <div v-if="noticeList.length" class="side-notice">
            <h3 class="side-subtitle">公告</h3>
            <ul class="notice-list">
              <li v-for="n in noticeList" :key="n.id" class="notice-item">
                <button class="notice-btn" type="button" @click="openNotice(n)">
                  <span class="notice-hospital">平台公告</span>
                  <span class="notice-text">{{ n.content }}</span>
                </button>
              </li>
            </ul>
          </div>
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

    <a-modal
      v-model:visible="hospitalModalVisible"
      title="搜索医院"
      :footer="false"
      width="520px"
      class="hospital-search-modal"
      @cancel="closeHospitalModal"
    >
      <div class="hospital-modal-head">
        <a-input-search
          v-model="hospitalKeyword"
          allow-clear
          placeholder="输入医院名称或地址…"
          search-button
          @search="onHospitalSearch"
          @press-enter="onHospitalSearch"
        />
      </div>
      <a-spin :loading="hospitalLoading" class="hospital-modal-spin">
        <ul v-if="hospitalResults.length" class="hospital-result-list">
          <li v-for="h in hospitalResults" :key="h.id" class="hospital-result-item">
            <router-link
              class="hospital-result-link"
              :to="{ name: 'PetHospitalPublic', params: { hospitalId: String(h.id) } }"
              @click="closeHospitalModal"
            >
              <span class="hospital-result-name">{{ h.hospitalName || '医院' }}</span>
              <span class="hospital-result-addr">{{ h.address || '—' }}</span>
            </router-link>
          </li>
        </ul>
        <p v-else-if="hospitalSearched && !hospitalLoading" class="hospital-empty">没有匹配的医院</p>
      </a-spin>
      <div v-if="hospitalTotal > hospitalPageSize" class="hospital-modal-pager">
        <a-pagination
          :total="hospitalTotal"
          :current="hospitalCurrent"
          :page-size="hospitalPageSize"
          size="small"
          simple
          @change="onHospitalPageChange"
        />
      </div>
      <div class="modal-footer-actions">
        <a-button @click="closeHospitalModal">关闭</a-button>
      </div>
    </a-modal>

    <a-modal
      v-model:visible="noticeModalVisible"
      title="医院公告"
      :footer="false"
      width="520px"
      class="hospital-notice-modal"
    >
      <div class="notice-modal-body">
        <p class="notice-modal-title">平台公告</p>
        <p class="notice-modal-text">{{ activeNotice?.content }}</p>
      </div>
      <div class="modal-footer-actions">
        <a-button type="primary" class="bili-primary" @click="noticeModalVisible = false">知道了</a-button>
      </div>
    </a-modal>
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
const noticeList = ref([]);
const noticeModalVisible = ref(false);
const activeNotice = ref(null);
const hospitalKeyword = ref('');
const hospitalLoading = ref(false);
const hospitalResults = ref([]);
const hospitalSearched = ref(false);
const hospitalModalVisible = ref(false);
const hospitalCurrent = ref(1);
const hospitalPageSize = ref(8);
const hospitalTotal = ref(0);
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

async function loadNotices() {
  try {
    const list = await petApi.adoptPlatformNoticeList(5);
    noticeList.value = Array.isArray(list) ? list : [];
  } catch {
    noticeList.value = [];
  }
}

function openNotice(n) {
  activeNotice.value = n || null;
  noticeModalVisible.value = !!(n && n.content);
}

function onHospitalSearchOpen() {
  const k = (hospitalKeyword.value || '').trim();
  if (!k) return;
  hospitalModalVisible.value = true;
  hospitalCurrent.value = 1;
  onHospitalSearch();
}

function closeHospitalModal() {
  hospitalModalVisible.value = false;
  // 不清空关键词，方便用户多次打开继续搜索
}

async function onHospitalSearch() {
  const k = (hospitalKeyword.value || '').trim();
  hospitalSearched.value = true;
  if (!k) {
    hospitalResults.value = [];
    hospitalTotal.value = 0;
    return;
  }
  hospitalLoading.value = true;
  try {
    const page = await petApi.adoptHospitalSearch({
      keyword: k,
      current: hospitalCurrent.value,
      pageSize: hospitalPageSize.value,
    });
    hospitalResults.value = page?.records || [];
    hospitalTotal.value = Number(page?.total) || 0;
  } catch {
    hospitalResults.value = [];
    hospitalTotal.value = 0;
  } finally {
    hospitalLoading.value = false;
  }
}

function onHospitalPageChange(p) {
  hospitalCurrent.value = p;
  onHospitalSearch();
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
  loadNotices();
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
.hospital-search {
  margin: 0 0 12px;
}
.side-notice {
  margin: 0 0 12px;
  padding: 12px 10px;
  border-radius: 12px;
  border: 1px solid var(--bili-line);
  background: linear-gradient(180deg, rgba(251, 114, 153, 0.06), rgba(251, 114, 153, 0.02));
}
.side-subtitle {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 900;
  color: var(--bili-text);
}
.notice-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.notice-btn {
  width: 100%;
  text-align: left;
  padding: 10px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}
.notice-btn:hover {
  border-color: rgba(251, 114, 153, 0.32);
  box-shadow: 0 10px 22px rgba(251, 114, 153, 0.12);
  transform: translateY(-1px);
}
.notice-hospital {
  display: block;
  font-size: 12px;
  font-weight: 900;
  color: var(--bili-text);
  line-height: 1.2;
}
.notice-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--bili-muted);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.hospital-notice-modal :deep(.arco-modal) {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--bili-line);
  box-shadow: 0 18px 60px rgba(16, 24, 40, 0.18);
}
.hospital-notice-modal :deep(.arco-modal-header) {
  position: relative;
  border-bottom: 1px solid var(--bili-line);
  background: linear-gradient(180deg, rgba(251, 114, 153, 0.12), rgba(251, 114, 153, 0.04));
  overflow: hidden;
}
.hospital-notice-modal :deep(.arco-modal-header)::before {
  content: '';
  position: absolute;
  inset: -10px;
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27160%27%20height%3D%2760%27%20viewBox%3D%270%200%20160%2060%27%3E%3Cg%20fill%3D%27%23fb7299%27%20fill-opacity%3D%270.22%27%3E%3Cpath%20d%3D%27M20%2038c6%200%2010%204%2010%209s-5%209-10%209-10-4-10-9%205-9%2010-9z%27/%3E%3Ccircle%20cx%3D%2711%27%20cy%3D%2728%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2719%27%20cy%3D%2725%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2729%27%20cy%3D%2728%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2723%27%20cy%3D%2721%27%20r%3D%273%27/%3E%3Cpath%20d%3D%27M92%2036c6%200%2010%204%2010%209s-5%209-10%209-10-4-10-9%205-9%2010-9z%27/%3E%3Ccircle%20cx%3D%2783%27%20cy%3D%2726%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2791%27%20cy%3D%2723%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%27101%27%20cy%3D%2726%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2795%27%20cy%3D%2719%27%20r%3D%273%27/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 70px;
  transform: rotate(-2deg);
  pointer-events: none;
  opacity: 0.55;
}
.hospital-notice-modal :deep(.arco-modal-title) {
  position: relative;
  font-weight: 900;
  color: var(--bili-text);
  letter-spacing: 0.2px;
}
.hospital-notice-modal :deep(.arco-modal-body) {
  padding: 16px 18px 14px;
  background: #fff;
}
.hospital-notice-modal :deep(.arco-modal-close-btn) {
  color: var(--bili-muted);
}
.notice-modal-body {
  padding: 6px 0 8px;
}
.notice-modal-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 900;
  color: var(--bili-text);
}
.notice-modal-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #4a5568;
  white-space: pre-wrap;
  word-break: break-word;
}
.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid var(--bili-line);
}
.bili-primary {
  background: var(--bili-pink, #fb7299) !important;
  border-color: var(--bili-pink, #fb7299) !important;
  color: #fff !important;
}
.bili-primary:hover {
  background: #ff8fb3 !important;
  border-color: #ff8fb3 !important;
  color: #fff !important;
}
.bili-outline {
  border-color: var(--bili-pink, #fb7299) !important;
  color: var(--bili-pink, #fb7299) !important;
  background: #fff !important;
}
.bili-outline:hover {
  border-color: #ff8fb3 !important;
  color: #ff8fb3 !important;
  background: rgba(251, 114, 153, 0.06) !important;
}
.hospital-search-modal :deep(.arco-modal) {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--bili-line);
  box-shadow: 0 18px 60px rgba(16, 24, 40, 0.18);
}
.hospital-search-modal :deep(.arco-modal-header) {
  position: relative;
  border-bottom: 1px solid var(--bili-line);
  background: linear-gradient(180deg, rgba(251, 114, 153, 0.12), rgba(251, 114, 153, 0.04));
  overflow: hidden;
}
.hospital-search-modal :deep(.arco-modal-header)::before {
  content: '';
  position: absolute;
  inset: -10px;
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27160%27%20height%3D%2760%27%20viewBox%3D%270%200%20160%2060%27%3E%3Cg%20fill%3D%27%23fb7299%27%20fill-opacity%3D%270.22%27%3E%3Cpath%20d%3D%27M20%2038c6%200%2010%204%2010%209s-5%209-10%209-10-4-10-9%205-9%2010-9z%27/%3E%3Ccircle%20cx%3D%2711%27%20cy%3D%2728%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2719%27%20cy%3D%2725%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2729%27%20cy%3D%2728%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2723%27%20cy%3D%2721%27%20r%3D%273%27/%3E%3Cpath%20d%3D%27M92%2036c6%200%2010%204%2010%209s-5%209-10%209-10-4-10-9%205-9%2010-9z%27/%3E%3Ccircle%20cx%3D%2783%27%20cy%3D%2726%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2791%27%20cy%3D%2723%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%27101%27%20cy%3D%2726%27%20r%3D%273%27/%3E%3Ccircle%20cx%3D%2795%27%20cy%3D%2719%27%20r%3D%273%27/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 70px;
  transform: rotate(-2deg);
  pointer-events: none;
  opacity: 0.55;
}
.hospital-search-modal :deep(.arco-modal-title) {
  position: relative;
  font-weight: 900;
  color: var(--bili-text);
  letter-spacing: 0.2px;
}
.hospital-search-modal :deep(.arco-modal-body) {
  padding: 16px 18px 14px;
  background: #fff;
}
.hospital-search-modal :deep(.arco-modal-close-btn) {
  color: var(--bili-muted);
}
.hospital-search-modal :deep(.arco-modal-mask) {
  backdrop-filter: blur(2px);
}
.hospital-modal-head {
  margin-bottom: 12px;
}
.hospital-search-modal :deep(.arco-input-search-button) {
  background: var(--bili-pink, #fb7299) !important;
  border-color: var(--bili-pink, #fb7299) !important;
  color: #fff !important;
}
.hospital-search-modal :deep(.arco-input-search-button:hover) {
  background: #ff8fb3 !important;
  border-color: #ff8fb3 !important;
  color: #fff !important;
}
.hospital-modal-spin {
  display: block;
  min-height: 120px;
}
.hospital-result-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--bili-line);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.hospital-result-item + .hospital-result-item {
  border-top: 1px solid var(--bili-line);
}
.hospital-result-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 10px;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease;
}
.hospital-result-link:hover {
  background: var(--bili-pink-soft);
}
.hospital-result-name {
  font-size: 13px;
  font-weight: 800;
  color: var(--bili-text);
  line-height: 1.2;
}
.hospital-result-addr {
  font-size: 12px;
  color: var(--bili-muted);
  line-height: 1.3;
}
.hospital-empty {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--bili-muted);
}
.hospital-modal-pager {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}
.hospital-search-modal :deep(.arco-pagination-item-active) {
  border-color: var(--bili-pink, #fb7299);
  color: var(--bili-pink, #fb7299);
}
.hospital-search-modal :deep(.arco-pagination-item:hover) {
  border-color: rgba(251, 114, 153, 0.45);
  color: var(--bili-pink, #fb7299);
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
