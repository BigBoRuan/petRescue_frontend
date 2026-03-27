<template>
  <div class="detail-page">
    <a-spin v-if="!hydrated" :loading="true" style="min-height: 200px; width: 100%" />
    <a-spin v-else-if="loggedIn && loading" :loading="true" style="min-height: 200px; width: 100%" />

    <template v-else-if="loggedIn && pet">
      <a-button type="text" class="back-link" @click="$router.push('/pets')">
        ← 返回列表
      </a-button>
      <div class="detail-layout">
        <div class="gallery">
          <div v-if="images.length" class="gallery-main">
            <img :src="images[0]" :alt="pet.petName" />
          </div>
          <div v-else class="gallery-placeholder">暂无图片</div>
          <div v-if="images.length > 1" class="gallery-thumbs">
            <img v-for="(u, i) in images.slice(1, 5)" :key="i" :src="u" alt="" />
          </div>
        </div>
        <div class="detail-panel">
          <h1 class="title">{{ pet.petName }}</h1>
          <p class="sub">{{ pet.petType }} · {{ pet.gender }} · {{ ageText(pet.age) }}</p>
          <a-tag color="arcoblue" size="small">{{ pet.hospitalName || '合作医院' }}</a-tag>
          <section class="block">
            <h2>健康状况</h2>
            <p>{{ pet.healthStatus || '—' }}</p>
          </section>
          <section class="block">
            <h2>性格与故事</h2>
            <p>{{ pet.characterDesc || '—' }}</p>
          </section>
        </div>
      </div>
    </template>

    <div v-else-if="loggedIn && !loading && !pet" class="empty-state">
      <p>未找到该宠物或已不可展示。</p>
      <a-button type="primary" class="bili-primary" @click="$router.push('/pets')">回列表</a-button>
    </div>

    <div v-else-if="hydrated" class="login-gate">
      <div class="gate-card">
        <div class="gate-illu">🐱</div>
        <h2>登录后查看完整档案</h2>
        <p>健康说明、性格描述与更多照片，登录账号后即可浏览。</p>
        <a-space>
          <a-button type="primary" class="bili-primary" @click="openLogin">立即登录</a-button>
          <a-button @click="$router.push('/pets')">先逛逛</a-button>
        </a-space>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import * as petApi from '@/api/petApi';
import { publicFileUrl } from '@/utils/publicAssetUrl';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';

const route = useRoute();
const userStore = useUserStore();
const uiStore = useUiStore();
const { user, hydrated } = storeToRefs(userStore);

const pet = ref(null);
const loading = ref(false);

const loggedIn = computed(() => !!user.value);

const images = computed(() =>
  (pet.value?.imageUrls || [])
    .filter(Boolean)
    .map((u) => publicFileUrl(String(u).trim()))
);

function ageText(age) {
  if (age == null || age === '') return '年龄未知';
  return `${age} 岁`;
}

function openLogin() {
  uiStore.openAuthModal({
    tab: 'login',
    onSuccess: () => loadPet(),
    onCancel: () => {
      if (!user.value) {
        // 保持在本页仅展示门槛；用户也可自行返回列表
      }
    },
  });
}

async function loadPet() {
  const idStr = route.params.id != null ? String(route.params.id).trim() : '';
  if (!/^\d+$/.test(idStr)) return;
  loading.value = true;
  pet.value = null;
  try {
    pet.value = await petApi.adoptGet(idStr);
  } catch {
    pet.value = null;
  } finally {
    loading.value = false;
  }
}

async function tryEnter() {
  if (!hydrated.value) {
    await userStore.fetchLoginUser();
  }
  if (!user.value) {
    openLogin();
    return;
  }
  await loadPet();
}

onMounted(tryEnter);
watch(
  () => route.params.id,
  () => {
    if (user.value) loadPet();
  }
);
watch(user, (u) => {
  if (u && route.name === 'PetDetail') loadPet();
});
</script>

<style scoped>
.detail-page {
  min-height: 40vh;
}
.back-link {
  margin-bottom: 16px;
  color: var(--bili-muted);
  padding-left: 0;
}
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;
}
@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
.gallery-main {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--bili-line);
  background: #f7f8fc;
}
.gallery-main img {
  width: 100%;
  display: block;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
.gallery-placeholder {
  border-radius: 14px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f0f3ff, #fff5f8);
  color: var(--bili-muted);
}
.gallery-thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.gallery-thumbs img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--bili-line);
}
.detail-panel .title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
}
.detail-panel .sub {
  margin: 0 0 12px;
  color: var(--bili-muted);
  font-size: 14px;
}
.block {
  margin-top: 20px;
}
.block h2 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--bili-text);
}
.block p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
}
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--bili-muted);
}
.login-gate {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}
.gate-card {
  max-width: 400px;
  text-align: center;
  padding: 36px 28px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid var(--bili-line);
  box-shadow: 0 8px 32px rgba(251, 114, 153, 0.1);
}
.gate-illu {
  font-size: 48px;
  margin-bottom: 12px;
}
.gate-card h2 {
  margin: 0 0 10px;
  font-size: 18px;
}
.gate-card p {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--bili-muted);
  line-height: 1.5;
}
.bili-primary {
  background: var(--bili-pink) !important;
  border-color: var(--bili-pink) !important;
}
</style>
