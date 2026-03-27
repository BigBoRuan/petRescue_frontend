/**
 * 业务错误（后端返回 code !== 0）：用于与网络异常区分，并在全局忽略未处理的 rejection 避免开发环境红屏
 */
export class BusinessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessError';
  }
}
