<template>
  <div class="hospital-region-address">
    <a-cascader
      :model-value="innerPath"
      :options="regionOptions"
      :disabled="disabled"
      path-mode
      allow-clear
      allow-search
      check-strictly
      expand-trigger="hover"
      placeholder="请选择省 / 市 / 区（县）"
      style="width: 100%"
      @update:model-value="onPathChange"
    />
    <p v-if="preview" class="preview">当前地址：{{ preview }}</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { regionData } from 'element-china-area-data';
import { joinCodesToAddress, tryParseAddressToPathCodes } from '@/utils/regionAddress';

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  /** 是否在下方展示拼接后的完整地址文案 */
  showPreview: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue']);

const regionOptions = regionData;
/** 级联绑定的编码路径，与 element-china-area-data 的 value 一致 */
const innerPath = ref();

watch(
  () => props.modelValue,
  (v) => {
    innerPath.value = tryParseAddressToPathCodes(v || '', regionData);
  },
  { immediate: true }
);

const preview = computed(() => {
  if (!props.showPreview) return '';
  const s = (props.modelValue || '').trim();
  return s || '（未选择）';
});

function onPathChange(val) {
  innerPath.value = val;
  emit('update:modelValue', joinCodesToAddress(val));
}
</script>

<style scoped>
.preview {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--color-text-3);
}
</style>
