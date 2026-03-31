<template>
  <div>
    <a-typography-title :heading="4" style="margin-top: 0">医院资料维护</a-typography-title>
    <a-typography-paragraph v-if="!hospitalId" type="secondary">
      无法确定医院 ID：医院管理员请从菜单进入；超级管理员请从「医院管理」点击「维护资料」。
    </a-typography-paragraph>

    <a-card v-else :loading="pageLoading" style="max-width: 720px; border-radius: 10px">
      <a-form :model="form" layout="vertical" @submit="submit">
        <a-form-item label="医院 ID">
          <a-input :model-value="String(hospitalId)" disabled />
        </a-form-item>
        <a-form-item field="hospitalName" label="医院名称" :rules="[{ required: true, message: '必填' }]">
          <a-input v-model="form.hospitalName" allow-clear />
        </a-form-item>
        <a-form-item field="address" label="地址" :rules="addressRules">
          <HospitalRegionAddress v-model="form.address" />
        </a-form-item>
        <a-form-item field="phone" label="联系电话" :rules="[{ required: true, message: '必填' }]">
          <a-input v-model="form.phone" allow-clear />
        </a-form-item>
        <a-form-item field="licenseNo" label="营业执照编号" :rules="[{ required: true, message: '必填' }]">
          <a-input v-model="form.licenseNo" allow-clear />
        </a-form-item>
        <a-form-item field="description" label="简介" :rules="[{ required: true, message: '必填' }]">
          <a-textarea v-model="form.description" :auto-size="{ minRows: 4, maxRows: 12 }" />
        </a-form-item>
        <a-form-item label="医院展示图">
          <ImageUploaderMixed
            ref="showcaseUploaderRef"
            hint="用户从领养中心「合作医院榜」进入本院页时将看到此处图片；支持上传或粘贴链接，最多 12 张。"
          />
        </a-form-item>
        <a-button type="primary" html-type="submit" :loading="saving">保存</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/stores/user';
import { ROLE } from '@/constants/roles';
import * as userApi from '@/api/userApi';
import { hospitalUpdate } from '@/api/hospitalApi';
import HospitalRegionAddress from '@/components/HospitalRegionAddress.vue';
import ImageUploaderMixed from '@/components/ImageUploaderMixed.vue';

const route = useRoute();
const showcaseUploaderRef = ref(null);

const addressRules = [
  { required: true, message: '请选择所在地区' },
  {
    validator: (value, cb) => {
      if (!value || String(value).trim().length < 5) {
        cb('请完整选择省 / 市 / 区（县）');
      } else {
        cb();
      }
    },
  },
];
const userStore = useUserStore();

/**
 * 医院管理员用本人 hospitalId；超管可用 URL ?id=
 */
const hospitalId = computed(() => {
  const q = route.query.id;
  if (q) return Number(q);
  if (userStore.user?.role === ROLE.HOSPITAL_ADMIN) {
    return userStore.user.hospitalId;
  }
  if (userStore.user?.role === ROLE.SUPER_ADMIN) {
    return undefined;
  }
  return userStore.user?.hospitalId;
});

const pageLoading = ref(false);
const saving = ref(false);
const form = reactive({
  hospitalName: '',
  address: '',
  phone: '',
  licenseNo: '',
  description: '',
});

async function loadHospital() {
  if (!hospitalId.value) return;
  pageLoading.value = true;
  let showcaseUrls = [];
  try {
    const h = await userApi.getHospitalById(hospitalId.value);
    form.hospitalName = h.hospitalName || '';
    form.address = h.address || '';
    form.phone = h.phone || '';
    form.licenseNo = h.licenseNo || '';
    form.description = h.description || '';
    const raw = h.showcaseImageUrls;
    showcaseUrls = Array.isArray(raw)
      ? raw.map((x) => String(x).trim()).filter(Boolean)
      : [];
  } finally {
    pageLoading.value = false;
  }
  /**
   * a-card :loading=true 时默认不渲染 body，ImageUploaderMixed 尚未挂载，
   * 须在关闭 loading 并等待一轮任务后再 loadPaths，否则已上传图无法回显。
   * （用 macrotask 而非 nextTick，避免部分环境下 import 与 ESLint 不一致。）
   */
  const afterPaint = () => new Promise((r) => setTimeout(r, 0));
  await afterPaint();
  showcaseUploaderRef.value?.loadPaths(showcaseUrls);
  if (showcaseUrls.length && !showcaseUploaderRef.value) {
    await afterPaint();
    showcaseUploaderRef.value?.loadPaths(showcaseUrls);
  }
}

watch(
  hospitalId,
  (id) => {
    if (id) loadHospital();
  },
  { immediate: true }
);

async function submit({ errors }) {
  if ((errors && Object.keys(errors).length) || !hospitalId.value) return;
  saving.value = true;
  try {
    const showcaseImageUrls = showcaseUploaderRef.value?.getMerged?.() ?? [];
    await hospitalUpdate({
      id: hospitalId.value,
      hospitalName: form.hospitalName,
      address: form.address,
      phone: form.phone,
      licenseNo: form.licenseNo,
      description: form.description,
      showcaseImageUrls,
    });
    Message.success('已保存');
  } finally {
    saving.value = false;
  }
}
</script>
