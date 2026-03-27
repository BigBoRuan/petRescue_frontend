<template>
  <a-layout class="pr-layout">
    <a-layout-sider collapsible breakpoint="lg" :width="220" class="pr-sider">
      <div class="pr-logo">宠物救助领养</div>
      <a-menu
        :selected-keys="[activeKey]"
        :open-keys="openKeys"
        @menu-item-click="onMenuClick"
      >
        <a-menu-item key="home">
          <template #icon><IconHome /></template>
          工作台
        </a-menu-item>
        <a-menu-item key="profile">
          <template #icon><IconUser /></template>
          个人资料
        </a-menu-item>
        <a-menu-item v-if="showUserAdmin" key="admin-users">
          <template #icon><IconUserGroup /></template>
          用户管理
        </a-menu-item>
        <a-menu-item v-if="showHospitalAdmin" key="admin-hospitals">
          <template #icon><IconApps /></template>
          医院管理
        </a-menu-item>
        <a-menu-item v-if="showHospitalSetting" key="hospital-setting">
          <template #icon><IconEdit /></template>
          医院资料
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="pr-header">
        <div class="pr-header-inner">
          <span class="pr-welcome">你好，{{ displayName }}</span>
          <a-space>
            <a-tag v-if="roleLabel" color="arcoblue" size="small">{{ roleLabel }}</a-tag>
            <a-button type="outline" size="small" @click="onLogout">退出登录</a-button>
          </a-space>
        </div>
      </a-layout-header>
      <a-layout-content class="pr-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IconHome,
  IconUser,
  IconUserGroup,
  IconApps,
  IconEdit,
} from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import { ROLE, ROLE_LABEL } from '@/constants/roles';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const role = computed(() => userStore.user?.role);
const displayName = computed(
  () => userStore.user?.realName || userStore.user?.username || '用户'
);
const roleLabel = computed(() => (role.value ? ROLE_LABEL[role.value] : ''));

const showUserAdmin = computed(() =>
  [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value)
);
const showHospitalAdmin = computed(() => role.value === ROLE.SUPER_ADMIN);
const showHospitalSetting = computed(() =>
  [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value)
);

/** 当前菜单高亮：根据路由 path 映射到 key */
const activeKey = computed(() => {
  const p = route.path;
  if (p.startsWith('/admin/users')) return 'admin-users';
  if (p.startsWith('/admin/hospitals')) return 'admin-hospitals';
  if (p.startsWith('/hospital/setting')) return 'hospital-setting';
  if (p.startsWith('/profile')) return 'profile';
  return 'home';
});

const openKeys = computed(() => []);

function onMenuClick(key) {
  const map = {
    home: '/home',
    profile: '/profile',
    'admin-users': '/admin/users',
    'admin-hospitals': '/admin/hospitals',
    'hospital-setting': '/hospital/setting',
  };
  router.push(map[key] || '/home');
}

async function onLogout() {
  await userStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.pr-layout {
  min-height: 100vh;
}
.pr-sider {
  background: var(--pr-surface) !important;
  border-right: 1px solid #e8e4dc;
}
.pr-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--pr-brand);
  letter-spacing: 0.02em;
  border-bottom: 1px solid #e8e4dc;
}
.pr-header {
  height: 56px;
  padding: 0 20px;
  background: var(--pr-surface) !important;
  border-bottom: 1px solid #e8e4dc;
}
.pr-header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pr-welcome {
  color: var(--pr-muted);
  font-size: 14px;
}
.pr-content {
  padding: 20px 24px 32px;
  min-height: calc(100vh - 56px);
}
</style>
