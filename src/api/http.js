import axios from 'axios';
import { Message, Modal } from '@arco-design/web-vue';
import { BusinessError } from './businessError';

/**
 * 业务失败时用弹窗提示（避免仅 Message 易被忽略；与 BusinessError + unhandledrejection 配合避免开发环境整页报错遮罩）
 */
/** 探测登录态等场景不弹业务错误窗（避免未登录用户满屏提示） */
function isSilentBizError(config) {
  if (!config) return false;
  if (config.skipBizErrorModal) return true;
  const u = config.url || '';
  return u.includes('/user/get/Login');
}

function showBizErrorModal(message) {
  Modal.error({
    title: '提示',
    content: message || '操作失败',
    okText: '知道了',
    maskClosable: true,
    escToClose: true,
  });
}

/**
 * 统一 HTTP 客户端：基地址与后端 context-path 一致（开发环境由 vue.config.js 代理到 8080）
 * withCredentials：携带 JSESSIONID，配合服务端 HttpSession 登录态
 */
const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 响应拦截：后端统一包一层 { code, data, message }，code===0 为成功
 * 未登录等场景由路由守卫统一处理，此处不自动跳转，避免公开页误伤
 */
http.interceptors.response.use(
  (res) => {
    const payload = res.data;
    if (payload && typeof payload.code === 'number') {
      if (payload.code === 0) {
        return payload;
      }
      const msg = payload.message || '请求失败';
      if (!isSilentBizError(res.config)) {
        showBizErrorModal(msg);
      }
      return Promise.reject(new BusinessError(msg));
    }
    return payload;
  },
  (err) => {
    const body = err.response?.data;
    const msg =
      (body && typeof body.message === 'string' && body.message) ||
      err.message ||
      '网络错误';
    if (body && typeof body.code === 'number' && body.code !== 0) {
      if (!isSilentBizError(err.config)) {
        showBizErrorModal(msg);
      }
      return Promise.reject(new BusinessError(msg));
    }
    Message.error(msg);
    return Promise.reject(err);
  }
);

export default http;

/**
 * 将 axios 返回的「已解包」payload 取出 data 字段（拦截器已返回整包）
 */
export function unwrapData(promise) {
  return promise.then((res) => res.data);
}
