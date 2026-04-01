<template>
  <div class="hospital-notice-admin">
    <a-typography-title :heading="4" style="margin-top: 0">医院公告</a-typography-title>
    <a-typography-paragraph type="secondary">
      医院管理员可发布本院公告；用户进入医院页面时若公告非空，将弹出提示并在医院信息区展示。
    </a-typography-paragraph>

    <a-card v-if="resolvedHospitalId" :loading="loading" style="max-width: 720px; border-radius: 10px">
      <a-form :model="form" layout="vertical" @submit="submit">
        <a-form-item label="医院 ID">
          <a-input-number
            v-if="isSuper"
            v-model="selectedHospitalId"
            :min="1"
            placeholder="输入医院 ID"
            style="width: 100%"
          />
          <a-input v-else :model-value="String(resolvedHospitalId)" disabled />
        </a-form-item>
        <a-form-item label="公告内容" :extra="extraTip">
          <a-textarea
            v-model="form.content"
            :max-length="2000"
            show-word-limit
            placeholder="请输入公告内容（留空表示不展示公告）"
            :auto-size="{ minRows: 6, maxRows: 14 }"
          />
        </a-form-item>
        <a-space>
          <a-button type="primary" class="bili-primary" html-type="submit" :loading="saving">保存公告</a-button>
          <a-button @click="reload" :disabled="loading || saving">刷新</a-button>
          <a-button status="danger" type="outline" @click="clearNotice" :disabled="loading || saving">
            清空公告
          </a-button>
        </a-space>
      </a-form>
    </a-card>

    <a-card v-else style="max-width: 720px; border-radius: 10px">
      <a-empty description="无法确定医院 ID（医院管理员请从左侧菜单进入；超级管理员请输入医院 ID）" />
    </a-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/stores/user';
import { ROLE } from '@/constants/roles';
import { getHospitalNotice, updateHospitalNotice } from '@/api/hospitalApi';

const route = useRoute();
const userStore = useUserStore();

const isSuper = computed(() => userStore.user?.role === ROLE.SUPER_ADMIN);
const selectedHospitalId = ref(undefined);

const resolvedHospitalId = computed(() => {
  const q = route.query.id;
  if (q) return Number(q);
  if (userStore.user?.role === ROLE.HOSPITAL_ADMIN) return userStore.user.hospitalId;
  if (userStore.user?.role === ROLE.SUPER_ADMIN) return selectedHospitalId.value;
  return undefined;
});

const extraTip = computed(() => {
  if (userStore.user?.role === ROLE.SUPER_ADMIN) {
    return '超级管理员：请输入医院 ID 后即可发布/清空公告。';
  }
  return '留空表示不展示公告；支持多行文本。';
});

const loading = ref(false);
const saving = ref(false);
const form = reactive({ content: '' });

async function reload() {
  const id = resolvedHospitalId.value;
  if (!id) return;
  loading.value = true;
  try {
    const c = await getHospitalNotice(id);
    form.content = c == null ? '' : String(c);
  } catch {
    form.content = '';
  } finally {
    loading.value = false;
  }
}

async function submit({ errors }) {
  if (errors && Object.keys(errors).length) return;
  const id = resolvedHospitalId.value;
  if (!id) return;
  saving.value = true;
  try {
    await updateHospitalNotice({ hospitalId: id, content: form.content });
    Message.success('公告已保存');
  } finally {
    saving.value = false;
  }
}

async function clearNotice() {
  form.content = '';
  await submit({ errors: null });
}

onMounted(async () => {
  if (!userStore.hydrated) await userStore.fetchLoginUser();
  if (userStore.user?.role === ROLE.SUPER_ADMIN) {
    const q = route.query.id;
    if (q) selectedHospitalId.value = Number(q);
  }
  await reload();
});

watch(resolvedHospitalId, () => {
  reload();
});
</script>

<style scoped>
.hospital-notice-admin {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--bili-line, #e8e8ef);
}
.bili-primary {
  background: var(--bili-pink, #fb7299) !important;
  border-color: var(--bili-pink, #fb7299) !important;
  color: #fff !important;
}
</style>

