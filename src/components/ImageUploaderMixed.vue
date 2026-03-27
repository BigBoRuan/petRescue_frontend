<template>
  <div class="image-uploader-mixed">
    <div class="upload-row">
      <a-upload :custom-request="handleUpload" accept="image/*" :show-file-list="false">
        <template #upload-button>
          <div class="upload-trigger">
            <IconPlus />
            <div class="upload-trigger-text">上传</div>
          </div>
        </template>
      </a-upload>
      <div v-for="u in uploadedPaths" :key="u" class="thumb">
        <img :src="publicFileUrl(u)" alt="" />
        <a-button type="text" size="mini" status="danger" class="thumb-del" @click="removeUploaded(u)">
          删除
        </a-button>
      </div>
    </div>
    <p v-if="hint" class="field-hint">{{ hint }}</p>
    <a-textarea
      v-model="urlText"
      :auto-size="{ minRows: 2, maxRows: maxTextareaRows }"
      :placeholder="textareaPlaceholder"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';
import * as fileApi from '@/api/fileApi';
import { publicFileUrl } from '@/utils/publicAssetUrl';

defineProps({
  hint: {
    type: String,
    default: '支持 jpg / png / webp / gif，单张不超过 8MB；也可在下方粘贴图片链接（每行一个）。',
  },
  textareaPlaceholder: {
    type: String,
    default: 'https://...（每行一个，可选）',
  },
  maxTextareaRows: { type: Number, default: 4 },
});

const uploadedPaths = ref([]);
const urlText = ref('');

function parseImageUrls(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getMerged() {
  const fromText = parseImageUrls(urlText.value);
  const set = new Set(
    [...uploadedPaths.value, ...fromText].map((s) => String(s).trim()).filter(Boolean)
  );
  return [...set];
}

function reset() {
  uploadedPaths.value = [];
  urlText.value = '';
}

async function handleUpload(option) {
  const file = option?.file ?? option?.fileItem?.file;
  if (!file) {
    option?.onError?.(new Error('no file'));
    return;
  }
  try {
    const path = await fileApi.uploadImageFile(file);
    uploadedPaths.value = [...uploadedPaths.value, path];
    option.onSuccess?.({});
    Message.success('已上传');
  } catch (e) {
    option.onError?.(e);
  }
}

function removeUploaded(url) {
  uploadedPaths.value = uploadedPaths.value.filter((x) => x !== url);
}

defineExpose({ getMerged, reset });
</script>

<style scoped>
.upload-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}
.upload-trigger {
  width: 80px;
  height: 80px;
  border: 1px dashed var(--color-neutral-3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
  cursor: pointer;
  transition: border-color 0.2s;
}
.upload-trigger:hover {
  border-color: rgb(var(--primary-6));
  color: rgb(var(--primary-6));
}
.upload-trigger-text {
  margin-top: 4px;
  font-size: 12px;
}
.thumb {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-neutral-3);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.thumb-del {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 0 4px !important;
  min-width: 0;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.45) !important;
  color: #fff !important;
}
.field-hint {
  margin: 8px 0 6px;
  font-size: 12px;
  color: var(--color-text-3);
}
</style>
