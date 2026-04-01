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

/** 管理端：获取医院公告（医院管理员获取本院；超级管理员可传 hospitalId） */
export function getHospitalNotice(hospitalId) {
  const params = {};
  if (hospitalId != null && hospitalId !== '') params.hospitalId = hospitalId;
  return unwrapData(http.get('/hospital/notice/get', { params }));
}

/** 管理端：更新医院公告（医院管理员更新本院；超级管理员可传 hospitalId） */
export function updateHospitalNotice(body) {
  return unwrapData(http.post('/hospital/notice/update', body));
}

/** 无需登录：申请编号 + 申请时填写的电话 */
export function getHospitalApplicationStatus(params) {
  return unwrapData(http.get('/hospital/application/status', { params }));
}
