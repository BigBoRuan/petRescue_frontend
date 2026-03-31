<template>
  <div>
    <a-typography-title :heading="4" style="margin-top: 0">工作台</a-typography-title>
    <a-typography-paragraph type="secondary">
      根据你的角色，可使用左侧菜单进入对应功能。
    </a-typography-paragraph>
    <a-row :gutter="16" style="margin-top: 8px">
      <a-col v-if="showVisualization" :xs="24" :sm="12" :md="8">
        <a-card class="dash-card" hoverable @click="$router.push('/admin/visualization')">
          <h3>数据可视化</h3>
          <p>饼图、趋势与结构树，查看本院或全平台救助与领养概况</p>
        </a-card>
      </a-col>
      <a-col v-if="showRescue" :xs="24" :sm="12" :md="8">
        <a-card class="dash-card" hoverable @click="$router.push('/admin/rescue')">
          <h3>救助与建档</h3>
          <p>上报流浪/受伤动物，完成救助并建立档案</p>
        </a-card>
      </a-col>
      <a-col v-if="showPets" :xs="24" :sm="12" :md="8">
        <a-card class="dash-card" hoverable @click="$router.push('/admin/pets')">
          <h3>宠物档案</h3>
          <p>维护本院宠物信息与领养状态</p>
        </a-card>
      </a-col>
      <a-col v-if="showUsers" :xs="24" :sm="12" :md="8">
        <a-card class="dash-card" hoverable @click="$router.push('/admin/users')">
          <h3>用户管理</h3>
          <p>管理本院或全平台用户</p>
        </a-card>
      </a-col>
      <a-col v-if="showHospitals" :xs="24" :sm="12" :md="8">
        <a-card class="dash-card" hoverable @click="$router.push('/admin/hospitals')">
          <h3>医院管理</h3>
          <p>审核入驻、维护医院</p>
        </a-card>
      </a-col>
      <a-col v-if="showHospitalSetting" :xs="24" :sm="12" :md="8">
        <a-card class="dash-card" hoverable @click="$router.push('/admin/hospital-setting')">
          <h3>医院资料</h3>
          <p>更新联系方式与简介</p>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { ROLE } from '@/constants/roles';

const userStore = useUserStore();
const role = computed(() => userStore.user?.role);

const showRescue = computed(() =>
  [ROLE.STAFF, ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value)
);
const showVisualization = computed(() =>
  [ROLE.STAFF, ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value)
);
const showPets = computed(() => [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value));
const showUsers = computed(() => [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value));
const showHospitals = computed(() => role.value === ROLE.SUPER_ADMIN);
const showHospitalSetting = computed(() =>
  [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN].includes(role.value)
);
</script>

<style scoped>
.dash-card {
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  border: 1px solid var(--bili-line, #e8e8ef);
}
.dash-card h3 {
  margin: 0 0 8px;
  font-size: 16px;
}
.dash-card p {
  margin: 0;
  font-size: 13px;
  color: var(--bili-muted, #6b6b6b);
  line-height: 1.45;
}
</style>
