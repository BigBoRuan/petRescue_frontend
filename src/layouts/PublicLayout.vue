<template>
  <div class="public-shell">
    <PublicHeader />
    <main class="public-main">
      <router-view />
    </main>
    <AuthModalCard />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PublicHeader from '@/components/PublicHeader.vue';
import AuthModalCard from '@/components/AuthModalCard.vue';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const uiStore = useUiStore();

onMounted(() => {
  userStore.fetchLoginUser();
});

watch(
  () => route.query.auth,
  (auth) => {
    if (auth === 'login' || auth === 'register') {
      uiStore.openAuthModal({ tab: auth === 'register' ? 'register' : 'login' });
      const q = { ...route.query };
      delete q.auth;
      router.replace({ path: route.path, query: q });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.public-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bili-page);
}
.public-main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 40px;
  box-sizing: border-box;
}
</style>
