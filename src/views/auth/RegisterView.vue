<template>
  <div class="auth-page">
    <div class="auth-card arco-card-shadow">
      <h1 class="auth-title">注册</h1>
      <p class="auth-desc">注册为普通用户（领养端账号）</p>
      <a-form :model="form" layout="vertical" @submit="submit">
        <a-form-item field="username" label="账号" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model="form.username" allow-clear placeholder="至少 4 位" />
        </a-form-item>
        <a-form-item
          field="password"
          label="密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password v-model="form.password" placeholder="至少 8 位" />
        </a-form-item>
        <a-form-item
          field="checkPassword"
          label="确认密码"
          :rules="[{ required: true, message: '请再次输入密码' }]"
        >
          <a-input-password v-model="form.checkPassword" placeholder="与密码一致" />
        </a-form-item>
        <a-button type="primary" html-type="submit" long :loading="loading">注册</a-button>
      </a-form>
      <div class="auth-links">
        <router-link to="/pets?auth=login">已有账号？去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import * as userApi from '@/api/userApi';

const router = useRouter();
const loading = ref(false);
const form = reactive({
  username: '',
  password: '',
  checkPassword: '',
});

async function submit({ values, errors }) {
  if (errors && Object.keys(errors).length) return;
  if (values.password !== values.checkPassword) {
    Message.warning('两次密码不一致');
    return;
  }
  loading.value = true;
  try {
    await userApi.userRegister({
      username: values.username,
      password: values.password,
      checkPassword: values.checkPassword,
    });
    Message.success('注册成功，请登录');
    router.replace({ path: '/pets', query: { auth: 'login' } });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(165deg, #e8ebe4 0%, var(--pr-bg) 45%, #ebe6df 100%);
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 32px 28px 28px;
  background: var(--pr-surface);
  border-radius: 12px;
  border: 1px solid #e5e0d8;
}
.auth-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--pr-brand);
}
.auth-desc {
  margin: 0 0 24px;
  color: var(--pr-muted);
  font-size: 14px;
}
.auth-links {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
}
.auth-links a {
  color: var(--pr-accent);
  text-decoration: none;
}
</style>
