import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 当前页弹窗登录/注册（不整页跳转）
 */
export const useUiStore = defineStore('ui', () => {
  const authModalVisible = ref(false);
  const authModalTab = ref('login');
  let onSuccessCb = null;
  let onCancelCb = null;

  function openAuthModal(opts = {}) {
    authModalTab.value = opts.tab === 'register' ? 'register' : 'login';
    onSuccessCb = opts.onSuccess || null;
    onCancelCb = opts.onCancel || null;
    authModalVisible.value = true;
  }

  function notifyAuthSuccess() {
    const fn = onSuccessCb;
    onSuccessCb = null;
    onCancelCb = null;
    authModalVisible.value = false;
    fn?.();
  }

  /** reason === 'cancel' 时触发 onCancel（如用户点遮罩关闭） */
  function notifyAuthModalClose(reason) {
    const cancel = onCancelCb;
    onSuccessCb = null;
    onCancelCb = null;
    authModalVisible.value = false;
    if (reason === 'cancel') {
      cancel?.();
    }
  }

  return {
    authModalVisible,
    authModalTab,
    openAuthModal,
    notifyAuthSuccess,
    notifyAuthModalClose,
  };
});
