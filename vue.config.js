const { defineConfig } = require('@vue/cli-service');

/**
 * 开发环境将 /api 代理到 Spring Boot（context-path: /api）
 * 浏览器只访问同源 /api，Cookie(JSESSIONID) 才能随请求携带，避免跨域丢会话
 */
module.exports = defineConfig({
  /** element-china-area-data 为现代 ESM，交给 Babel 转译以免旧版 webpack 解析失败 */
  transpileDependencies: ['element-china-area-data'],
  devServer: {
    port: 8081,
    /** WebStorm / 终端启动后自动打开本机地址，省去手动输入 URL */
    open: true,
    /**
     * 关闭「Uncaught runtime errors」全屏黑遮罩：业务错误已在 http 里用 Modal 提示，
     * 未 catch 的 Promise.reject 仍会触发该遮罩；函数型 runtimeErrors 经 JSON 注入客户端可能不稳定。
     * runtimeErrors: false 只关运行时异常遮罩，编译/语法错误（errors: true）仍会显示。
     */
    client: {
      overlay: {
        warnings: false,
        errors: true,
        runtimeErrors: false,
      },
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
