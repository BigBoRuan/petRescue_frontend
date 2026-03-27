<template>
  <div class="apply-wrap">
    <a-page-header title="宠物医院入驻申请" @back="goBack" />
    <a-card class="apply-card" title="填写医院信息">
      <template #extra>
        <a-space>
          <router-link to="/hospital/status">查询入驻进度</router-link>
          <router-link to="/pets">返回首页</router-link>
        </a-space>
      </template>
      <a-form :model="form" layout="vertical" @submit="submit">
        <a-row :gutter="16">
          <a-col :xs="24" :md="12">
            <a-form-item
              field="hospitalName"
              label="医院名称"
              :rules="[{ required: true, message: '必填' }, minLen5('医院名称')]"
            >
              <a-input v-model="form.hospitalName" placeholder="不少于 5 个字" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item
              field="phone"
              label="联系电话"
              :rules="[{ required: true, message: '必填' }, minLen5('联系电话')]"
            >
              <a-input v-model="form.phone" allow-clear maxlength="20" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item field="address" label="地址" :rules="addressRules">
              <HospitalRegionAddress v-model="form.address" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item
              field="licenseNo"
              label="营业执照编号"
              :rules="[{ required: true, message: '必填' }, minLen5('营业执照编号')]"
            >
              <a-input v-model="form.licenseNo" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item
              field="description"
              label="医院简介"
              :rules="[{ required: true, message: '必填' }]"
            >
              <a-textarea
                v-model="form.description"
                placeholder="介绍科室、资质等"
                :max-length="800"
                show-word-limit
                :auto-size="{ minRows: 4, maxRows: 10 }"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-button type="primary" html-type="submit" :loading="loading">提交申请</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Modal } from '@arco-design/web-vue';
import { hospitalRegister } from '@/api/hospitalApi';
import HospitalRegionAddress from '@/components/HospitalRegionAddress.vue';

const router = useRouter();

/** 与入驻接口字段长度校验一致，提交前在表单内提示，减少无效请求 */
function minLen5(label) {
  return {
    validator: (value, cb) => {
      if (!value || String(value).trim().length < 5) {
        cb(`${label}不能少于 5 个字符`);
      } else {
        cb();
      }
    },
  };
}

/** 与后端「地址不少于 5 字」校验对齐；内容为省市区名称拼接 */
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
const loading = ref(false);

function goBack() {
  router.push('/pets');
}
const form = reactive({
  hospitalName: '',
  address: '',
  phone: '',
  licenseNo: '',
  description: '',
});

async function submit({ values, errors }) {
  if (errors && Object.keys(errors).length) return;
  loading.value = true;
  try {
    const id = await hospitalRegister(values);
    Object.assign(form, {
      hospitalName: '',
      address: '',
      phone: '',
      licenseNo: '',
      description: '',
    });
    Modal.success({
      title: '申请已提交',
      content: `申请编号：${id}\n\n请保存该编号，并使用申请时填写的「联系电话」在「查询入驻进度」页面查看审核结果。`,
      okText: '去查询进度',
      maskClosable: true,
      escToClose: true,
      onOk: () => {
        router.push({ path: '/hospital/status', query: { id: String(id) } });
      },
    });
  } catch {
    /* 业务类错误已在 http 拦截器内 Modal 提示 */
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.apply-wrap {
  max-width: 880px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}
.apply-card {
  margin-top: 8px;
  border-radius: 10px;
}
</style>
