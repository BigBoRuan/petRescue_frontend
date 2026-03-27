<template>
  <router-view />
</template>

<script setup>
// 根组件仅作为路由出口，具体布局在各页面/布局组件内完成
</script>

<style>
/* 前台偏 B 站：浅底、粉强调；保留原变量兼容旧页 */
:root {
  --bili-page: #f6f7f9;
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
  height: 100%;
  margin: 0;
  background: var(--bili-page);
  color: var(--bili-text);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
</style>
