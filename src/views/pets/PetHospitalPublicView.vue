<template>
  <div class="hospital-public">
    <a-spin v-if="loadingHospital" :loading="true" class="spin-block" />
    <template v-else-if="hospital">
      <a-button type="text" class="back-link" @click="$router.push({ name: 'PetAdoptList' })">
        ← 返回领养中心
      </a-button>

      <header class="hospital-header">
        <h1 class="hospital-title">{{ hospital.hospitalName }}</h1>
        <div class="hospital-meta">
          <p v-if="hospital.address"><span class="label">地址</span>{{ hospital.address }}</p>
          <p v-if="hospital.phone"><span class="label">电话</span>{{ hospital.phone }}</p>
        </div>
        <p v-if="hospital.description" class="hospital-desc">{{ hospital.description }}</p>
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
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as petApi from '@/api/petApi';
import PetAdoptCard from '@/components/pets/PetAdoptCard.vue';

const route = useRoute();
const hospital = ref(null);
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
    hospital.value = await petApi.adoptHospitalPublic(id);
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
  padding: 20px 20px 18px;
  margin-bottom: 22px;
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
