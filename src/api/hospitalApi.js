import http, { unwrapData } from './http';

/**
 * 医院模块接口（HospitalController，公开注册无需登录）
 */
export function hospitalRegister(body) {
  return unwrapData(http.post('/hospital/register', body));
}

export function hospitalUpdate(body) {
  return unwrapData(http.post('/hospital/update', body));
}

/** 无需登录：申请编号 + 申请时填写的电话 */
export function getHospitalApplicationStatus(params) {
  return unwrapData(http.get('/hospital/application/status', { params }));
}
