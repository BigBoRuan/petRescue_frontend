<template>
  <div>
    <a-typography-title :heading="4" style="margin-top: 0">工作台</a-typography-title>
    <a-typography-paragraph type="secondary">
      根据你的角色，可使用左侧菜单进入「用户管理」「医院管理」或「医院资料」等功能。普通用户可完善个人资料，后续可扩展救助上报、领养申请等模块。
    </a-typography-paragraph>
    <a-row :gutter="16" style="margin-top: 8px">
      <a-col :xs="24" :sm="12" :md="8">
        <a-card title="账号信息" size="small" class="tile">
          <p>用户名：{{ user?.username || '—' }}</p>
          <p>角色：{{ roleText }}</p>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="8">
        <a-card title="快捷入口" size="small" class="tile">
          <a-space direction="vertical" fill>
            <a-button type="text" @click="$router.push('/profile')">编辑个人资料</a-button>
            <a-button v-if="isSuper" type="text" @click="$router.push('/admin/hospitals')">
              审核医院入驻
            </a-button>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { ROLE, ROLE_LABEL } from '@/constants/roles';

const userStore = useUserStore();
const user = computed(() => userStore.user);
const roleText = computed(() => ROLE_LABEL[user.value?.role] || '—');
const isSuper = computed(() => user.value?.role === ROLE.SUPER_ADMIN);
</script>

<style scoped>
.tile {
  min-height: 120px;
  border-radius: 10px;
}
.tile p {
  margin: 6px 0;
  font-size: 14px;
}
</style>
