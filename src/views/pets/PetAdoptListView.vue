<template>
  <div class="pet-list-page">
    <section class="hero">
      <h1 class="hero-title">寻找一个新家人</h1>
      <p class="hero-sub">已完成救助、开放领养的毛孩子们，都在这里等你。</p>
    </section>

    <a-spin :loading="loading" style="width: 100%">
      <div v-if="!loading && items.length === 0" class="empty-hint">
        <p>暂无可领养宠物，请稍后再来看看～</p>
      </div>
      <div v-else class="card-grid">
        <router-link
          v-for="p in items"
          :key="p.id"
          :to="{ name: 'PetDetail', params: { id: String(p.id) } }"
          class="pet-card"
        >
          <div class="pet-cover">
            <img v-if="cover(p)" :src="cover(p)" :alt="p.petName" />
            <div v-else class="pet-cover-placeholder">暂无图片</div>
            <span class="pet-chip">{{ p.hospitalName || '合作医院' }}</span>
          </div>
          <div class="pet-body">
            <h3 class="pet-name">{{ p.petName }}</h3>
            <p class="pet-meta">{{ p.petType }} · {{ p.gender }} · {{ ageText(p.age) }}</p>
            <p class="pet-desc">{{ shortDesc(p.characterDesc || p.healthStatus) }}</p>
          </div>
        </router-link>
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
</template>

<script setup>
import { onMounted, ref } from 'vue';
import * as petApi from '@/api/petApi';
import { publicFileUrl } from '@/utils/publicAssetUrl';

const loading = ref(true);
const items = ref([]);
const total = ref(0);
const current = ref(1);
const pageSize = ref(12);

function cover(p) {
  const u = p.imageUrls?.[0];
  if (!u || !String(u).trim()) return '';
  return publicFileUrl(String(u).trim());
}

function ageText(age) {
  if (age == null || age === '') return '年龄未知';
  return `${age} 岁`;
}

function shortDesc(s) {
  if (!s) return '点击查看更多故事';
  const t = String(s).trim();
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}

async function load() {
  loading.value = true;
  try {
    const page = await petApi.adoptList({
      current: current.value,
      pageSize: pageSize.value,
    });
    items.value = page.records || [];
    total.value = page.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onPageChange(p) {
  current.value = p;
  load();
}

onMounted(load);
</script>

<style scoped>
.pet-list-page {
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
.hero {
  margin-bottom: 24px;
}
.hero-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 800;
  color: var(--bili-text);
  letter-spacing: 0.02em;
}
.hero-sub {
  margin: 0;
  font-size: 14px;
  color: var(--bili-muted);
}
.empty-hint {
  text-align: center;
  padding: 48px 16px;
  color: var(--bili-muted);
  font-size: 14px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}
.pet-card {
  text-decoration: none;
  color: inherit;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--bili-line);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.pet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(251, 114, 153, 0.12);
}
.pet-cover {
  position: relative;
  aspect-ratio: 4 / 3;
  background: linear-gradient(160deg, #f5f7ff, #fff5f8);
}
.pet-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pet-cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #aab;
}
.pet-chip {
  position: absolute;
  left: 10px;
  bottom: 10px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  backdrop-filter: blur(4px);
}
.pet-body {
  padding: 14px 14px 16px;
}
.pet-name {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--bili-text);
}
.pet-meta {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--bili-muted);
}
.pet-desc {
  margin: 0;
  font-size: 13px;
  color: #5c6478;
  line-height: 1.45;
}
.pager {
  margin-top: 28px;
  display: flex;
  justify-content: center;
}
</style>
