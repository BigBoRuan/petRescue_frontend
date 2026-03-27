import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as userApi from '@/api/userApi';

/**
 * 登录用户全局状态：与后端 Session 同步，刷新页面后通过 getLogin 接口恢复
 */
export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  /** 是否已尝试过拉取登录态（避免路由守卫重复请求） */
  const hydrated = ref(false);

  async function fetchLoginUser() {
    try {
      const data = await userApi.getLoginUser();
      user.value = data;
      return data;
    } catch {
      user.value = null;
      return null;
    } finally {
      hydrated.value = true;
    }
  }

  function setUser(u) {
    user.value = u;
    hydrated.value = true;
  }

  function clearUser() {
    user.value = null;
    hydrated.value = true;
  }

  async function logout() {
    try {
      await userApi.userLogout();
    } finally {
      clearUser();
    }
  }

  return { user, hydrated, fetchLoginUser, setUser, clearUser, logout };
});
