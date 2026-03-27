<template>
  <router-view />
</template>

<script setup>
// 根组件仅作为路由出口，具体布局在各页面/布局组件内完成
</script>

<style>
/* 前台偏 B 站：浅底、粉强调；保留原变量兼容旧页 */
:root {
  /* 纯色兜底（不支持渐变或打印时） */
  --bili-page: #eef0f6;
  /* 养眼渐变：灰蓝 → 淡紫 → 极浅杏粉，饱和度低、对比柔和 */
  --bili-page-gradient: linear-gradient(
    165deg,
    #e8ecf4 0%,
    #f0edf8 36%,
    #faf5f7 68%,
    #f5f3ef 100%
  );
  --bili-surface: #ffffff;
  --bili-text: #18191c;
  --bili-muted: #9499a0;
  --bili-line: #e8e8ef;
  --bili-pink: #fb7299;
  --bili-pink-soft: rgba(251, 114, 153, 0.12);
  --bili-blue: #00a1d6;
  --pr-bg: var(--bili-page);
  --pr-surface: var(--bili-surface);
  --pr-ink: var(--bili-text);
  --pr-muted: var(--bili-muted);
  --pr-brand: #3a5f4a;
  --pr-brand-hover: #2d4a38;
  --pr-accent: var(--bili-pink);
}

html,
body,
#app {
  min-height: 100%;
  margin: 0;
  background-color: var(--bili-page);
  background-image: var(--bili-page-gradient);
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  color: var(--bili-text);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 管理端主按钮与前台统一为品牌粉（Arco 默认蓝改为粉） */
.admin-layout .arco-btn-primary:not(.arco-btn-disabled),
.admin-layout .arco-btn-primary:not(.arco-btn-disabled):focus-visible {
  background-color: var(--bili-pink) !important;
  border-color: var(--bili-pink) !important;
  color: #fff !important;
}
.admin-layout .arco-btn-primary:not(.arco-btn-disabled):hover {
  background-color: #ff85a8 !important;
  border-color: #ff85a8 !important;
}

/* 品牌色标签（替代 arcoblue） */
.bili-tag.arco-tag {
  background: var(--bili-pink-soft) !important;
  color: var(--bili-pink) !important;
  border-color: transparent !important;
}
</style>
