<template>
  <div class="platform-notice-admin">
    <a-typography-title :heading="4" style="margin-top: 0">公告发布</a-typography-title>
    <a-typography-paragraph type="secondary">
      超级管理员发布的平台公告会展示在「领养中心」右侧栏；内容为空则不会展示。
    </a-typography-paragraph>

    <a-card style="max-width: 720px; border-radius: 10px">
      <a-form :model="form" layout="vertical" @submit="submit">
        <a-form-item label="公告内容" :extra="`最多 2000 字，支持多行`">
          <a-textarea
            v-model="form.content"
            :max-length="2000"
            show-word-limit
            placeholder="请输入公告内容…"
            :auto-size="{ minRows: 6, maxRows: 14 }"
          />
        </a-form-item>
        <a-space>
          <a-button type="primary" class="bili-primary" html-type="submit" :loading="saving">发布</a-button>
          <a-button @click="form.content = ''" :disabled="saving">清空</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { publishPlatformNotice } from '@/api/noticeApi';

const saving = ref(false);
const form = reactive({ content: '' });

async function submit({ errors }) {
  if (errors && Object.keys(errors).length) return;
  const c = (form.content || '').trim();
  if (!c) {
    Message.warning('请输入公告内容');
    return;
  }
  saving.value = true;
  try {
    await publishPlatformNotice({ content: c });
    Message.success('已发布');
    form.content = '';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.platform-notice-admin {
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
.bili-primary:hover {
  background: #ff8fb3 !important;
  border-color: #ff8fb3 !important;
  color: #fff !important;
}
</style>

