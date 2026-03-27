<template>
  <div class="auth-page">
    <div class="auth-card arco-card-shadow">
      <h1 class="auth-title">登录</h1>
      <p class="auth-desc">宠物救助领养管理平台</p>
      <a-form :model="form" layout="vertical" @submit="submit">
        <a-form-item field="username" label="账号" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model="form.username" allow-clear placeholder="用户名" />
        </a-form-item>
        <a-form-item field="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model="form.password" placeholder="密码" />
        </a-form-item>
        <a-button type="primary" html-type="submit" long :loading="loading">登录</a-button>
      </a-form>
      <div class="auth-links">
        <router-link to="/register">注册普通用户</router-link>
        <span class="dot">·</span>
        <router-link to="/hospital/apply">医院入驻申请</router-link>
        <span class="dot">·</span>
        <router-link to="/hospital/status">查询入驻进度</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import * as userApi from '@/api/userApi';
import { useUserStore } from '@/stores/user';
import { ROLE, STAFF_ENTRY_PATH } from '@/constants/roles';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
const form = reactive({
  username: '',
  password: '',
});

async function submit({ values, errors }) {
  if (errors && Object.keys(errors).length) return;
  loading.value = true;
  try {
    const user = await userApi.userLogin(values);
    userStore.setUser(user);
    Message.success('登录成功');
    const q = route.query.redirect;
    if (user.role === ROLE.STAFF) {
      if (typeof q === 'string' && q.startsWith('/admin')) {
        router.replace(q);
      } else {
        router.replace(STAFF_ENTRY_PATH);
      }
      return;
    }
    const redirect = q || '/pets';
    router.replace(String(redirect));
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
.auth-links a:hover {
  text-decoration: underline;
}
.dot {
  margin: 0 8px;
  color: #bbb;
}
</style>
