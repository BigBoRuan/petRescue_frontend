import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import App from './App.vue';
import router from './router';

/**
 * 业务接口已用 Modal 提示；未写 catch 的 await 仍会 reject。
 * 对 BusinessError 阻止默认行为，避免 Vue 开发环境「Uncaught runtime errors」全屏遮罩。
 */
window.addEventListener('unhandledrejection', (event) => {
  const r = event.reason;
  if (r && r.name === 'BusinessError') {
    event.preventDefault();
  }
});

/**
 * 应用入口：挂载路由、Pinia 状态库、Arco Design 组件库
 */
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ArcoVue);
app.mount('#app');
