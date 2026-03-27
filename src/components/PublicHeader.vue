<template>
  <header class="pub-header">
    <div class="pub-header-inner">
      <router-link :to="logoTarget" class="logo">
        <span class="logo-mark">🐾</span>
        <span class="logo-text">宠物救助领养</span>
      </router-link>

      <nav class="nav">
        <router-link
          v-if="!isStaff"
          to="/pets"
          class="nav-link"
          active-class="nav-link--active"
        >
          领养中心
        </router-link>
        <router-link
          v-else
          :to="STAFF_ENTRY_PATH"
          class="nav-link nav-link--accent"
          active-class="nav-link--active"
        >
          救助与建档
        </router-link>
        <router-link to="/profile" class="nav-link" active-class="nav-link--active">个人中心</router-link>
        <router-link
          v-if="showAdminEntry"
          to="/admin"
          class="nav-link nav-link--accent"
          active-class="nav-link--active"
        >
          管理端
        </router-link>
      </nav>

      <div class="header-right">
        <!-- position=bottom：弹层相对触发器水平居中（对齐导航栏头像中心），避免 br 贴右侧错位 -->
        <a-trigger v-if="!user" position="bottom" trigger="hover" :popup-translate="[0, 10]">
          <div class="avatar-slot" role="button" tabindex="0" @click="openLogin" @keyup.enter="openLogin">
            <div class="avatar-ring avatar-ring--guest">
              <IconUser class="guest-icon" />
            </div>
          </div>
          <template #content>
            <!-- 未登录：仅保留导航栏上的触发头像，卡片内不再重复图标 -->
            <div class="hover-card hover-card--guest">
              <p class="hover-title">你还未登录</p>
              <p class="hover-desc">登录后可查看宠物详情或进入救助登记</p>
              <a-button type="primary" size="small" class="bili-btn" @click="openLogin">立即登录</a-button>
            </div>
          </template>
        </a-trigger>

        <a-trigger v-else position="bottom" trigger="hover" :popup-translate="[0, 10]">
          <div class="avatar-slot" role="button" tabindex="0" @click="goProfile" @keyup.enter="goProfile">
            <div class="avatar-ring">
              <img
                v-if="avatarOk"
                :src="avatarDisplaySrc"
                alt="头像"
                class="avatar-img"
                @error="avatarOk = false"
              />
              <span v-else class="avatar-fallback">{{ nameInitial }}</span>
            </div>
          </div>
          <template #content>
            <!-- 已登录：头像仅在导航栏触发器上展示一份，浮层内只显示昵称与操作 -->
            <div class="hover-card">
              <p class="hover-name">{{ displayName }}</p>
              <p class="hover-role">{{ roleLabel }}</p>
              <div class="hover-actions">
                <a-button type="text" size="small" @click="goProfile">个人资料</a-button>
                <a-button v-if="showAdminEntry" type="text" size="small" @click="goAdmin">管理端</a-button>
                <a-button type="text" size="small" status="danger" @click="onLogout">退出</a-button>
              </div>
            </div>
          </template>
        </a-trigger>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { IconUser } from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';
import { ROLE, ROLE_LABEL, STAFF_ENTRY_PATH } from '@/constants/roles';
import { publicFileUrl } from '@/utils/publicAssetUrl';

const router = useRouter();
const userStore = useUserStore();
const uiStore = useUiStore();
const { user } = storeToRefs(userStore);

const avatarOk = ref(true);
const avatarUrl = computed(() => (user.value?.userAvatarUrl || '').trim());
const avatarDisplaySrc = computed(() => (avatarUrl.value ? publicFileUrl(avatarUrl.value) : ''));
watch(avatarUrl, () => {
  avatarOk.value = !!avatarUrl.value;
});

const displayName = computed(
  () => user.value?.realName || user.value?.username || '用户'
);
const nameInitial = computed(() => {
  const n = displayName.value;
  return n ? n.slice(0, 1).toUpperCase() : '?';
});
const roleLabel = computed(() =>
  user.value?.role ? ROLE_LABEL[user.value.role] || '' : ''
);

const isStaff = computed(() => user.value?.role === ROLE.STAFF);

const logoTarget = computed(() => (isStaff.value ? STAFF_ENTRY_PATH : '/pets'));

/** 医院管理员 / 超管显示「管理端」；员工从「救助与建档」进入，不显示此项 */
const showAdminEntry = computed(() =>
  [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(user.value?.role)
);

function openLogin() {
  uiStore.openAuthModal({ tab: 'login' });
}

function goProfile() {
  router.push('/profile');
}

function goAdmin() {
  router.push('/admin');
}

async function onLogout() {
  await userStore.logout();
  router.push('/pets');
}
</script>

<style scoped>
.pub-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--bili-line);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}
.pub-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--bili-text);
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}
.logo-mark {
  font-size: 22px;
  line-height: 1;
}
.logo-text {
  letter-spacing: 0.02em;
}
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.nav-link {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 14px;
  color: var(--bili-muted);
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
}
.nav-link:hover {
  color: var(--bili-pink);
  background: var(--bili-pink-soft);
}
.nav-link--active {
  color: var(--bili-pink);
  background: var(--bili-pink-soft);
  font-weight: 600;
}
.nav-link--accent {
  color: var(--bili-blue);
}
.header-right {
  flex-shrink: 0;
}
.avatar-slot {
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  outline: none;
}
.avatar-slot:focus-visible .avatar-ring {
  box-shadow: 0 0 0 2px var(--bili-pink-soft), 0 0 0 4px var(--bili-pink);
}
.avatar-ring {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f0f3ff, #ffe8f0);
  transition: transform 0.22s ease;
}
.avatar-slot:hover .avatar-ring {
  transform: scale(1.12);
}
.avatar-ring--guest {
  background: #eef1f6;
}
.guest-icon {
  font-size: 20px;
  color: #94a0b8;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-fallback {
  font-size: 14px;
  font-weight: 700;
  color: var(--bili-pink);
}
.hover-card {
  min-width: 240px;
  max-width: 280px;
  padding: 12px 16px 14px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--bili-line);
  text-align: center;
}
.hover-title {
  margin: 0 0 4px;
  font-weight: 600;
  font-size: 14px;
  color: var(--bili-text);
}
.hover-desc {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--bili-muted);
  line-height: 1.45;
}
.hover-name {
  margin: 0 0 4px;
  font-weight: 700;
  font-size: 16px;
  color: var(--bili-pink);
}
.hover-role {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--bili-muted);
}
.hover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  border-top: 1px solid var(--bili-line);
  padding-top: 10px;
  margin-top: 4px;
}
.bili-btn {
  background: var(--bili-pink) !important;
  border-color: var(--bili-pink) !important;
  border-radius: 6px;
}
</style>
