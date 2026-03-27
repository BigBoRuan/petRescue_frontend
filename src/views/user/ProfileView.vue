<template>
  <div>
    <a-typography-title :heading="4" style="margin-top: 0">个人资料</a-typography-title>

    <div v-if="hydrated && !user" class="guest-profile">
      <a-card class="guest-card" :bordered="false">
        <p class="guest-title">登录后管理资料</p>
        <p class="guest-desc">修改头像、联系方式等需要先登录账号。</p>
        <a-button type="primary" class="bili-primary" @click="openAuth">登录 / 注册</a-button>
      </a-card>
    </div>

    <a-card v-else style="max-width: 560px; border-radius: 10px">
      <!-- 头像：展示图片；点击后弹窗填写链接并保存 -->
      <div
        class="avatar-block"
        role="button"
        tabindex="0"
        @click="openAvatarModal"
        @keyup.enter="openAvatarModal"
      >
        <div class="avatar-frame">
          <img
            v-if="showAvatarPicture"
            :src="avatarDisplaySrc"
            alt="头像"
            class="avatar-img"
            @error="onAvatarImgError"
          />
          <a-avatar v-else :size="96">
            <IconUser />
          </a-avatar>
        </div>
        <p class="avatar-hint">点击更换头像</p>
      </div>

      <a-form :model="form" layout="vertical" @submit="submit">
        <a-form-item label="登录账号">
          <a-input :model-value="user?.username" disabled />
        </a-form-item>
        <a-form-item field="realName" label="真实姓名">
          <a-input v-model="form.realName" allow-clear placeholder="选填" />
        </a-form-item>
        <a-form-item field="phone" label="手机号">
          <a-input v-model="form.phone" allow-clear placeholder="选填" />
        </a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading">保存</a-button>
      </a-form>
    </a-card>

    <a-modal
      v-model:visible="avatarModalVisible"
      title="更换头像"
      :ok-loading="avatarSaving"
      @ok="confirmAvatar"
      @cancel="avatarModalVisible = false"
    >
      <p class="modal-tip">可本地上传（jpg/png 等），或粘贴 http(s) 外链；本地上传后保存为站内地址。</p>
      <a-upload :custom-request="handleAvatarUpload" accept="image/*" :show-file-list="false">
        <template #upload-button>
          <a-button type="outline">上传本地图片</a-button>
        </template>
      </a-upload>
      <a-divider orientation="center" style="margin: 16px 0">或填写链接</a-divider>
      <a-input
        v-model="avatarDraft"
        allow-clear
        placeholder="https://... 或 /uploads/images/..."
      />
      <div class="preview-wrap">
        <span class="preview-label">预览</span>
        <div class="preview-frame">
          <img
            v-if="previewShowImg"
            :src="previewImgSrc"
            alt="预览"
            class="preview-img"
            @error="onPreviewError"
          />
          <a-avatar v-else :size="72">
            <IconUser />
          </a-avatar>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Message } from '@arco-design/web-vue';
import { IconUser } from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';
import * as userApi from '@/api/userApi';
import * as fileApi from '@/api/fileApi';
import { publicFileUrl, isStorableImageRef } from '@/utils/publicAssetUrl';

const userStore = useUserStore();
const uiStore = useUiStore();
const { user, hydrated } = storeToRefs(userStore);

onMounted(() => {
  if (!hydrated.value) userStore.fetchLoginUser();
});

function openAuth() {
  uiStore.openAuthModal({ tab: 'login' });
}
const loading = ref(false);

const form = reactive({
  realName: '',
  phone: '',
  /** 头像图片地址（表单内维护，页面仅展示图片） */
  userAvatarUrl: '',
});

/** 主区域头像：当前生效链接（表单为准，与登录态同步） */
const currentAvatarUrl = computed(() => (form.userAvatarUrl || '').trim());

/** 主图是否加载失败（失败则退回默认头像组件） */
const avatarBroken = ref(false);
watch(currentAvatarUrl, () => {
  avatarBroken.value = false;
});

const avatarDisplaySrc = computed(() =>
  currentAvatarUrl.value ? publicFileUrl(currentAvatarUrl.value) : ''
);

const showAvatarPicture = computed(
  () =>
    !!currentAvatarUrl.value && isStorableImageRef(currentAvatarUrl.value) && !avatarBroken.value
);

function onAvatarImgError() {
  avatarBroken.value = true;
}

const avatarModalVisible = ref(false);
const avatarDraft = ref('');
const avatarSaving = ref(false);

/** 弹窗内输入去掉首尾空格，用于预览 */
const avatarDraftTrimmed = computed(() => avatarDraft.value.trim());

const previewBroken = ref(false);
watch(avatarDraftTrimmed, () => {
  previewBroken.value = false;
});

const previewImgSrc = computed(() => publicFileUrl(avatarDraftTrimmed.value));

const previewShowImg = computed(
  () => isStorableImageRef(avatarDraftTrimmed.value) && !previewBroken.value
);

function onPreviewError() {
  previewBroken.value = true;
}

async function handleAvatarUpload(option) {
  const file = option?.file ?? option?.fileItem?.file;
  if (!file) {
    option?.onError?.(new Error('no file'));
    return;
  }
  try {
    const path = await fileApi.uploadImageFile(file);
    avatarDraft.value = path;
    previewBroken.value = false;
    option.onSuccess?.({});
    Message.success('已上传，确认后保存');
  } catch (e) {
    option.onError?.(e);
  }
}

function openAvatarModal() {
  avatarDraft.value = form.userAvatarUrl || '';
  previewBroken.value = false;
  avatarModalVisible.value = true;
}

async function confirmAvatar() {
  const next = avatarDraft.value.trim();
  if (next && !isStorableImageRef(next)) {
    Message.warning('请上传图片或输入以 http(s) 开头的链接，或本站 /uploads/ 路径');
    return;
  }
  avatarSaving.value = true;
  try {
    form.userAvatarUrl = next;
    await userApi.updateMyUser({
      realName: form.realName,
      phone: form.phone,
      userAvatarUrl: next,
    });
    Message.success('头像已更新');
    avatarModalVisible.value = false;
    avatarBroken.value = false;
    await userStore.fetchLoginUser();
  } finally {
    avatarSaving.value = false;
  }
}

watch(
  () => userStore.user,
  (u) => {
    if (!u) return;
    form.realName = u.realName || '';
    form.phone = u.phone || '';
    form.userAvatarUrl = u.userAvatarUrl || '';
  },
  { immediate: true }
);

async function submit({ errors }) {
  if (errors && Object.keys(errors).length) return;
  loading.value = true;
  try {
    await userApi.updateMyUser({
      realName: form.realName,
      phone: form.phone,
      userAvatarUrl: (form.userAvatarUrl || '').trim(),
    });
    Message.success('已保存');
    await userStore.fetchLoginUser();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  cursor: pointer;
  user-select: none;
  outline: none;
}
.avatar-block:focus-visible .avatar-frame {
  box-shadow: 0 0 0 2px var(--color-primary-light-3);
}
.avatar-frame {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e0d8;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #faf8f5;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--pr-muted, #6b6b6b);
}
.modal-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--pr-muted, #6b6b6b);
}
.preview-wrap {
  margin-top: 16px;
}
.preview-label {
  display: block;
  font-size: 13px;
  color: var(--pr-muted, #6b6b6b);
  margin-bottom: 8px;
}
.preview-frame {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #e5e0d8;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #faf8f5;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.guest-profile {
  margin-top: 16px;
}
.guest-card {
  max-width: 480px;
  border-radius: 12px;
  border: 1px solid var(--bili-line, #e8e8ef);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}
.guest-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
}
.guest-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--bili-muted, #6b6b6b);
}
.bili-primary {
  background: var(--bili-pink, #fb7299) !important;
  border-color: var(--bili-pink, #fb7299) !important;
}
</style>
