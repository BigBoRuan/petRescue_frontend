<template>
  <a-layout class="admin-layout">
    <a-layout-sider collapsible breakpoint="lg" :width="228" class="admin-sider">
      <div class="admin-logo">{{ titleShort }}</div>
      <a-menu :selected-keys="[activeKey]" @menu-item-click="onMenuClick">
        <a-menu-item v-if="!isStaff" key="dash">
          <template #icon><IconHome /></template>
          工作台
        </a-menu-item>
        <a-menu-item v-if="showRescue" key="rescue">
          <template #icon><IconHeart /></template>
          救助与建档
        </a-menu-item>
        <a-menu-item v-if="showVisualization" key="visualization">
          <template #icon><IconMindMapping /></template>
          数据可视化
        </a-menu-item>
        <a-menu-item v-if="showPets" key="pets">
          <template #icon><IconImage /></template>
          宠物档案
        </a-menu-item>
        <a-menu-item v-if="showAdoption" key="adoption">
          <template #icon><IconFile /></template>
          领养与回访
        </a-menu-item>
        <a-menu-item v-if="showUsers" key="users">
          <template #icon><IconUserGroup /></template>
          用户管理
        </a-menu-item>
        <a-menu-item v-if="showHospitals" key="hospitals">
          <template #icon><IconApps /></template>
          医院管理
        </a-menu-item>
        <a-menu-item v-if="showHospitalSetting" key="hospital-setting">
          <template #icon><IconEdit /></template>
          医院资料
        </a-menu-item>
        <a-menu-item v-if="showHospitalNotice" key="hospital-notice">
          <template #icon><IconNotification /></template>
          医院公告
        </a-menu-item>
        <a-menu-item v-if="showPlatformNotice" key="notice-publish">
          <template #icon><IconNotification /></template>
          公告发布
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="admin-header">
        <div class="admin-header-row">
          <h1 class="admin-page-title">{{ headerTitle }}</h1>
          <a-space>
            <a-button type="text" @click="goPublic">{{ isStaff ? '个人资料' : '返回前台' }}</a-button>
            <a-button type="outline" size="small" @click="onLogout">退出</a-button>
          </a-space>
        </div>
      </a-layout-header>
      <a-layout-content class="admin-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IconHome,
  IconUserGroup,
  IconApps,
  IconEdit,
  IconHeart,
  IconImage,
  IconFile,
  IconMindMapping,
  IconNotification,
} from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import { ROLE } from '@/constants/roles';
import * as userApi from '@/api/userApi';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const hospitalName = ref('');

const role = computed(() => userStore.user?.role);

const isStaff = computed(() => role.value === ROLE.STAFF);

const showRescue = computed(() =>
  [ROLE.STAFF, ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value)
);
const showVisualization = computed(() =>
  [ROLE.STAFF, ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value)
);
const showPets = computed(() => [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value));
const showAdoption = computed(() => [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value));
const showUsers = computed(() => [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value));
const showHospitals = computed(() => role.value === ROLE.SUPER_ADMIN);
const showHospitalSetting = computed(() =>
  [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value)
);
const showHospitalNotice = computed(() => role.value === ROLE.HOSPITAL_ADMIN);
const showPlatformNotice = computed(() => role.value === ROLE.SUPER_ADMIN);

const headerTitle = computed(() => {
  if (role.value === ROLE.SUPER_ADMIN) {
    return '管理端';
  }
  if (role.value === ROLE.STAFF) {
    return hospitalName.value ? `${hospitalName.value} · 救助登记` : '救助登记';
  }
  if (hospitalName.value) {
    return `${hospitalName.value} · 管理端`;
  }
  return '管理端';
});

const titleShort = computed(() => {
  if (role.value === ROLE.SUPER_ADMIN) return '管理端';
  if (role.value === ROLE.STAFF) {
    if (hospitalName.value) {
      const n = hospitalName.value;
      return n.length > 8 ? `${n.slice(0, 8)}…` : n;
    }
    return '救助登记';
  }
  if (hospitalName.value) {
    const n = hospitalName.value;
    return n.length > 8 ? `${n.slice(0, 8)}…` : n;
  }
  return '管理端';
});

const activeKey = computed(() => {
  const p = route.path;
  if (p.startsWith('/admin/rescue')) return 'rescue';
  if (p.startsWith('/admin/visualization')) return 'visualization';
  if (p.startsWith('/admin/pets')) return 'pets';
  if (p.startsWith('/admin/adoption')) return 'adoption';
  if (p.startsWith('/admin/users')) return 'users';
  if (p.startsWith('/admin/hospitals')) return 'hospitals';
  if (p.startsWith('/admin/hospital-setting')) return 'hospital-setting';
  if (p.startsWith('/admin/hospital-notice')) return 'hospital-notice';
  if (p.startsWith('/admin/notice-publish')) return 'notice-publish';
  return 'dash';
});

function onMenuClick(key) {
  const map = {
    dash: '/admin',
    rescue: '/admin/rescue',
    visualization: '/admin/visualization',
    pets: '/admin/pets',
    adoption: '/admin/adoption',
    users: '/admin/users',
    hospitals: '/admin/hospitals',
    'hospital-setting': '/admin/hospital-setting',
    'hospital-notice': '/admin/hospital-notice',
    'notice-publish': '/admin/notice-publish',
  };
  router.push(map[key] || '/admin');
}

function goPublic() {
  if (isStaff.value) {
    router.push('/profile');
    return;
  }
  router.push('/pets');
}

async function onLogout() {
  await userStore.logout();
  router.push('/pets');
}

onMounted(async () => {
  const uid = userStore.user?.hospitalId;
  if (uid && role.value !== ROLE.SUPER_ADMIN) {
    try {
      const h = await userApi.getHospitalById(uid);
      hospitalName.value = h?.hospitalName || '';
    } catch {
      hospitalName.value = '';
    }
  } else {
    hospitalName.value = '';
  }
});
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: var(--bili-page, #eef0f6);
  background-image: var(--bili-page-gradient, none);
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
}
.admin-layout :deep(> .arco-layout) {
  background: transparent !important;
}
.admin-sider {
  background: #fff !important;
  border-right: 1px solid var(--bili-line, #e8e8ef);
}
.admin-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--bili-pink, #fb7299);
  border-bottom: 1px solid var(--bili-line, #e8e8ef);
  padding: 0 8px;
  text-align: center;
}
.admin-header {
  height: auto !important;
  padding: 0 !important;
  background: #fff !important;
  border-bottom: 1px solid var(--bili-line, #e8e8ef);
}
.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  min-height: 56px;
  box-sizing: border-box;
}
.admin-page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--bili-text, #18191c);
}
.admin-content {
  padding: 20px 22px 32px;
  min-height: calc(100vh - 56px);
  background: transparent;
}
</style>
