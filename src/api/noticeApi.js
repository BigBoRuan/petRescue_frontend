import http, { unwrapData } from './http';

/** 超级管理员发布平台公告 */
export function publishPlatformNotice(body) {
  return unwrapData(http.post('/notice/publish', body));
}

