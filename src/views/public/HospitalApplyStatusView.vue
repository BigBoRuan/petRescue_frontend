<template>
  <div class="status-wrap">
    <a-page-header title="查询入驻进度" @back="goBack" />
    <a-card class="status-card" title="凭申请信息查询审核状态">
      <template #extra>
        <router-link to="/hospital/apply">去申请入驻</router-link>
      </template>
      <a-typography-paragraph type="secondary">
        提交申请成功后会获得<strong>申请编号</strong>，请与当时填写的<strong>联系电话</strong>一起在此查询（无需登录）。
      </a-typography-paragraph>
      <a-form :model="form" layout="vertical" style="max-width: 420px" @submit="onQuery">
        <a-form-item field="id" label="申请编号" :rules="idRules">
          <a-input v-model="form.id" allow-clear placeholder="提交成功时返回的数字编号" />
        </a-form-item>
        <a-form-item
          field="phone"
          label="联系电话"
          :rules="[{ required: true, message: '请填写联系电话' }, minLen5]"
        >
          <a-input v-model="form.phone" allow-clear maxlength="20" placeholder="与申请时一致" />
        </a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="loading">查询</a-button>
          <router-link to="/pets?auth=login">去登录</router-link>
        </a-space>
      </a-form>

      <a-card v-if="result" class="result-card" :title="result.hospitalName">
        <a-descriptions :column="1" size="large">
          <a-descriptions-item label="申请编号">{{ result.id }}</a-descriptions-item>
          <a-descriptions-item label="审核状态">
            <a-tag :color="statusColor">{{ statusText }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="提交时间">{{ result.createTime || '—' }}</a-descriptions-item>
          <template v-if="result.status === HOSPITAL_STATUS.PASS && result.hospitalAdminUsername">
            <a-descriptions-item label="医院管理员账号">
              <span class="mono">{{ result.hospitalAdminUsername }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="初始密码">
              <span class="mono">{{ result.hospitalAdminInitialPassword || '—' }}</span>
            </a-descriptions-item>
          </template>
        </a-descriptions>
        <a-alert v-if="result.status === HOSPITAL_STATUS.PASS" type="success" style="margin-top: 16px">
          审核已通过。请使用上方账号与初始密码在「登录」页进入系统；首次登录后建议尽快修改密码。若该账号密码已在系统中修改过，请以当前密码为准。
        </a-alert>
        <a-alert v-else-if="result.status === HOSPITAL_STATUS.REFUSE" type="warning" style="margin-top: 16px">
          本次申请未通过，如需继续入驻请核对资料后重新提交申请。
        </a-alert>
      </a-card>
    </a-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getHospitalApplicationStatus } from '@/api/hospitalApi';
import { HOSPITAL_STATUS, HOSPITAL_STATUS_LABEL } from '@/constants/roles';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const result = ref(null);

const form = reactive({
  id: '',
  phone: '',
});

const idRules = [
  { required: true, message: '请填写申请编号' },
  {
    validator: (value, cb) => {
      const n = Number(String(value).trim());
      if (!Number.isFinite(n) || n <= 0) {
        cb('请输入正确的数字编号');
      } else {
        cb();
      }
    },
  },
];

const minLen5 = {
  validator: (value, cb) => {
    if (!value || String(value).trim().length < 5) {
      cb('联系电话至少 5 个字符');
    } else {
      cb();
    }
  },
};

watch(
  () => route.query.id,
  (q) => {
    if (q != null && q !== '') {
      form.id = String(q);
    }
  },
  { immediate: true }
);

function goBack() {
  router.push('/pets');
}

const statusText = computed(() => {
  if (result.value == null) return '—';
  const s = result.value.status;
  if (s === undefined || s === null) return '—';
  return HOSPITAL_STATUS_LABEL[s] ?? String(s);
});

const statusColor = computed(() => {
  const s = result.value?.status;
  if (s === HOSPITAL_STATUS.PASS) return 'green';
  if (s === HOSPITAL_STATUS.REFUSE) return 'red';
  if (s === HOSPITAL_STATUS.CLOSE) return 'gray';
  return 'orange';
});

async function onQuery({ errors }) {
  if (errors && Object.keys(errors).length) return;
  result.value = null;
  loading.value = true;
  try {
    const data = await getHospitalApplicationStatus({
      id: Number(String(form.id).trim()),
      phone: form.phone.trim(),
    });
    result.value = data;
  } catch {
    /* 错误已由 http 拦截器弹窗 */
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.status-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}
.status-card {
  margin-top: 8px;
  border-radius: 10px;
}
.result-card {
  margin-top: 24px;
  border-radius: 10px;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-all;
}
</style>
