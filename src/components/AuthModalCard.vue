<template>
  <a-modal
    :visible="authModalVisible"
    :footer="false"
    width="420px"
    :mask-closable="true"
    class="auth-modal-bili"
    @update:visible="onVisibleUpdate"
  >
    <template #title>
      <span class="auth-modal-title">{{ authModalTab === 'register' ? '注册账号' : '登录' }}</span>
    </template>
    <a-tabs v-model:active-key="authModalTab" type="rounded" size="large">
      <a-tab-pane key="login" title="登录">
        <a-form :model="loginForm" layout="vertical" class="auth-form" @submit="submitLogin">
          <a-form-item field="username" label="账号" :rules="[{ required: true, message: '请输入账号' }]">
            <a-input v-model="loginForm.username" allow-clear placeholder="用户名" />
          </a-form-item>
          <a-form-item field="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
            <a-input-password v-model="loginForm.password" placeholder="密码" />
          </a-form-item>
          <a-button type="primary" html-type="submit" long :loading="loginLoading" class="auth-submit">
            登录
          </a-button>
        </a-form>
      </a-tab-pane>
      <a-tab-pane key="register" title="注册">
        <a-form :model="regForm" layout="vertical" class="auth-form" @submit="submitRegister">
          <a-form-item field="username" label="账号" :rules="[{ required: true, message: '请输入账号' }]">
            <a-input v-model="regForm.username" allow-clear placeholder="至少 4 位" />
          </a-form-item>
          <a-form-item field="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
            <a-input-password v-model="regForm.password" placeholder="至少 8 位" />
          </a-form-item>
          <a-form-item
            field="checkPassword"
            label="确认密码"
            :rules="[{ required: true, message: '请再次输入密码' }]"
          >
            <a-input-password v-model="regForm.checkPassword" placeholder="与密码一致" />
          </a-form-item>
          <a-button type="primary" html-type="submit" long :loading="regLoading" class="auth-submit">
            注册
          </a-button>
        </a-form>
      </a-tab-pane>
    </a-tabs>
    <div class="auth-modal-footer">
      <router-link to="/hospital/apply" @click="closeAndLeave">医院入驻申请</router-link>
      <span class="dot">·</span>
      <router-link to="/hospital/status" @click="closeAndLeave">查询入驻进度</router-link>
    </div>
  </a-modal>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import * as userApi from '@/api/userApi';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';
import { ROLE, STAFF_ENTRY_PATH } from '@/constants/roles';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const userStore = useUserStore();
const { authModalVisible, authModalTab } = storeToRefs(uiStore);

const loginLoading = ref(false);
const regLoading = ref(false);
const loginForm = reactive({ username: '', password: '' });
const regForm = reactive({ username: '', password: '', checkPassword: '' });

function onVisibleUpdate(v) {
  if (!v) {
    uiStore.notifyAuthModalClose('cancel');
  }
}

function closeAndLeave() {
  uiStore.notifyAuthModalClose('dismiss');
}

async function submitLogin({ values, errors }) {
  if (errors && Object.keys(errors).length) return;
  loginLoading.value = true;
  try {
    const user = await userApi.userLogin(values);
    userStore.setUser(user);
    Message.success('登录成功');
    uiStore.notifyAuthSuccess();
    await userStore.fetchLoginUser();
    if (user.role === ROLE.STAFF) {
      const redir = route.query.redirect;
      if (typeof redir === 'string' && redir.startsWith('/admin')) {
        router.replace(redir);
      } else {
        router.replace(STAFF_ENTRY_PATH);
      }
      return;
    }
    const redir = route.query.redirect;
    if (redir && typeof redir === 'string' && redir.startsWith('/')) {
      router.replace(redir);
    }
  } finally {
    loginLoading.value = false;
  }
}

async function submitRegister({ values, errors }) {
  if (errors && Object.keys(errors).length) return;
  if (values.password !== values.checkPassword) {
    Message.warning('两次密码不一致');
    return;
  }
  regLoading.value = true;
  try {
    await userApi.userRegister({
      username: values.username,
      password: values.password,
      checkPassword: values.checkPassword,
    });
    Message.success('注册成功，请登录');
    authModalTab.value = 'login';
    loginForm.username = values.username;
    loginForm.password = '';
  } finally {
    regLoading.value = false;
  }
}
</script>

<style scoped>
.auth-modal-bili :deep(.arco-modal-header) {
  border-bottom: none;
  padding-bottom: 0;
}
.auth-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--bili-text);
}
.auth-form {
  margin-top: 8px;
}
.auth-submit {
  margin-top: 4px;
  border-radius: 8px;
  background: var(--bili-pink) !important;
  border-color: var(--bili-pink) !important;
}
.auth-submit:hover {
  filter: brightness(1.05);
}
.auth-modal-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--bili-line);
  text-align: center;
  font-size: 13px;
}
.auth-modal-footer a {
  color: var(--bili-pink);
  text-decoration: none;
}
.auth-modal-footer a:hover {
  text-decoration: underline;
}
.dot {
  margin: 0 8px;
  color: #ccc;
}
</style>
