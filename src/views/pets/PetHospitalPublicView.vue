<template>
  <div class="hospital-public">
    <a-spin v-if="loadingHospital" :loading="true" class="spin-block" />
    <template v-else-if="hospital">
      <a-button type="text" class="back-link" @click="$router.push({ name: 'PetAdoptList' })">
        ← 返回领养中心
      </a-button>

      <header class="hospital-header">
        <div class="hospital-header-body">
          <div class="hospital-header-info">
            <h1 class="hospital-title">{{ hospital.hospitalName }}</h1>
            <div class="hospital-meta">
              <p v-if="hospital.address"><span class="label">地址</span>{{ hospital.address }}</p>
              <p v-if="hospital.phone"><span class="label">电话</span>{{ hospital.phone }}</p>
            </div>
            <p v-if="hospital.description" class="hospital-desc">{{ hospital.description }}</p>
          </div>
          <!-- 仅 1 张：静态展示；2 张及以上：轮播 -->
          <div v-if="showcaseUrls.length === 1" class="hospital-header-media">
            <a-image
              class="hospital-media-frame"
              :src="publicFileUrl(showcaseUrls[0])"
              width="100%"
              :preview="true"
            />
          </div>
          <div v-else-if="showcaseUrls.length > 1" class="hospital-header-media">
            <!-- Arco Carousel 根节点为 .arco-carousel，必须在父级用 :deep 设死高度，否则轨道高度为 0 整区空白（与领养中心首屏轮播同理） -->
            <div class="hospital-carousel-wrap">
              <a-carousel
                class="hospital-showcase-carousel"
                :auto-play="{ interval: 4000, hoverToPause: true }"
                animation-name="fade"
                indicator-type="dot"
                show-arrow="hover"
              >
                <a-carousel-item v-for="(url, idx) in showcaseUrls" :key="idx">
                  <div class="hospital-carousel-slide">
                    <img
                      class="hospital-carousel-img"
                      :src="publicFileUrl(url)"
                      :alt="`${hospital.hospitalName || '医院'} 展示 ${idx + 1}`"
                      loading="lazy"
                    />
                  </div>
                </a-carousel-item>
              </a-carousel>
            </div>
          </div>
          <div v-else class="hospital-header-media hospital-header-media--empty">
            <span>暂无医院展示图</span>
          </div>
        </div>
      </header>

      <h2 class="section-title">本院待领养宠物</h2>
      <p class="section-sub">按最新上架排序</p>

      <a-spin :loading="loadingPets" class="spin-block">
        <div v-if="!loadingPets && items.length === 0" class="empty-hint">
          <p>当前暂无待领养宠物。</p>
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
    </template>
    <div v-else class="empty-hint">
      <p>未找到该医院或暂未开放展示。</p>
      <a-button type="primary" class="bili-primary" @click="$router.push({ name: 'PetAdoptList' })">
        回领养中心
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as petApi from '@/api/petApi';
import PetAdoptCard from '@/components/pets/PetAdoptCard.vue';
import { publicFileUrl } from '@/utils/publicAssetUrl';

const route = useRoute();

const hospital = ref(null);

/** 兼容 camelCase / snake_case；避免接口字段名不一致导致前台不展示 */
function extractShowcaseUrls(raw) {
  if (!raw || typeof raw !== 'object') return [];
  let v = raw.showcaseImageUrls ?? raw.showcase_image_urls;
  if (v == null) return [];
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      v = Array.isArray(p) ? p : [];
    } catch {
      const s = v.trim();
      return s ? [s] : [];
    }
  }
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

const showcaseUrls = computed(() => extractShowcaseUrls(hospital.value));
const loadingHospital = ref(true);
const loadingPets = ref(true);
const items = ref([]);
const total = ref(0);
const current = ref(1);
const pageSize = ref(12);

const hospitalId = () => {
  const id = route.params.hospitalId;
  return id != null ? String(id).trim() : '';
};

async function loadHospital() {
  const id = hospitalId();
  if (!/^\d+$/.test(id)) {
    hospital.value = null;
    loadingHospital.value = false;
    return;
  }
  loadingHospital.value = true;
  try {
    const data = await petApi.adoptHospitalPublic(id);
    hospital.value = data
      ? { ...data, showcaseImageUrls: extractShowcaseUrls(data) }
      : null;
  } catch {
    hospital.value = null;
  } finally {
    loadingHospital.value = false;
  }
}

async function loadPets() {
  const id = hospitalId();
  if (!hospital.value || !/^\d+$/.test(id)) {
    items.value = [];
    total.value = 0;
    loadingPets.value = false;
    return;
  }
  loadingPets.value = true;
  try {
    const page = await petApi.adoptList({
      current: current.value,
      pageSize: pageSize.value,
      hospitalId: id,
    });
    items.value = page.records || [];
    total.value = page.total ?? 0;
  } catch {
    items.value = [];
    total.value = 0;
  } finally {
    loadingPets.value = false;
  }
}

function onPageChange(p) {
  current.value = p;
  loadPets();
}

onMounted(async () => {
  await loadHospital();
  current.value = 1;
  await loadPets();
});

watch(
  () => route.params.hospitalId,
  async () => {
    await loadHospital();
    current.value = 1;
    await loadPets();
  }
);
</script>

<style scoped>
.hospital-public {
  animation: fade-in 0.3s ease;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.spin-block {
  width: 100%;
  min-height: 160px;
}
.back-link {
  margin-bottom: 12px;
  color: var(--bili-muted);
  padding-left: 0;
}
.hospital-header {
  background: #fff;
  border: 1px solid var(--bili-line);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 22px;
}
.hospital-header-body {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
}
.hospital-header-info {
  flex: 1;
  min-width: 220px;
}
.hospital-header-media {
  flex: 0 1 320px;
  width: 100%;
  max-width: 360px;
  min-width: 200px;
  min-height: 220px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--bili-line);
  background: #fff;
  align-self: flex-start;
}
.hospital-carousel-wrap {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}
/* 与 PetAdoptListView 首屏轮播：给 .arco-carousel 根本身 height，不能只设 slide */
.hospital-carousel-wrap :deep(.arco-carousel) {
  width: 100%;
  height: 220px;
  min-height: 220px;
  overflow: hidden;
}
.hospital-carousel-wrap :deep(.arco-carousel-arrow > div) {
  background: rgba(255, 255, 255, 0.88);
  color: var(--bili-pink, #fb7299);
}
.hospital-carousel-wrap :deep(.arco-carousel-indicator-item-active::after) {
  background: var(--bili-pink, #fb7299);
}
.hospital-header-media--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #f7f8fa;
  border: 1px dashed var(--bili-line);
  color: var(--bili-muted);
  font-size: 13px;
}
.hospital-media-frame :deep(.arco-image-img) {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
.hospital-showcase-carousel {
  width: 100%;
}
.hospital-carousel-slide {
  height: 100%;
  min-height: 220px;
  width: 100%;
  background: #f5f6fa;
  overflow: hidden;
}
.hospital-carousel-img {
  width: 100%;
  height: 100%;
  min-height: 220px;
  object-fit: cover;
  display: block;
  vertical-align: top;
}
.hospital-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 800;
  color: var(--bili-text);
}
.hospital-meta {
  font-size: 13px;
  color: #4a5568;
  line-height: 1.6;
}
.hospital-meta p {
  margin: 0 0 4px;
}
.hospital-meta .label {
  display: inline-block;
  min-width: 40px;
  color: var(--bili-muted);
  margin-right: 6px;
}
.hospital-desc {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: #4a5568;
}
.section-title {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 800;
}
.section-sub {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--bili-muted);
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.empty-hint {
  text-align: center;
  padding: 40px 16px;
  color: var(--bili-muted);
}
.pager {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
