import http, { unwrapData } from './http';

/**
 * 用户模块接口（路径与 Knife4j /v3/api-docs 中 UserController 一致）
 */
export function userRegister(body) {
  return unwrapData(http.post('/user/register', body));
}

export function userLogin(body) {
  return unwrapData(http.post('/user/login', body));
}

export function userLogout() {
  return unwrapData(http.post('/user/logout'));
}

/** 注意：后端路径为 get/Login（大小写混合） */
export function getLoginUser() {
  return unwrapData(http.get('/user/get/Login'));
}

export function updateMyUser(body) {
  return unwrapData(http.post('/user/my/updateMyUser', body));
}

/** 当前登录用户修改本人密码（需原密码） */
export function changeMyPassword(body) {
  return unwrapData(http.post('/user/my/changePassword', body));
}

export function addUser(body) {
  return unwrapData(http.post('/user/add', body));
}

export function deleteUser(body) {
  return unwrapData(http.post('/user/delete', body));
}

export function updateUser(body) {
  return unwrapData(http.post('/user/update', body));
}

export function getUserById(id) {
  return unwrapData(http.get('/user/getUser', { params: { id } }));
}

export function listUserPage(body) {
  return unwrapData(http.post('/user/list/userPage', body));
}

export function getHospitalById(id) {
  return unwrapData(http.get('/user/getHospital', { params: { id } }));
}

export function listHospitalPage(body) {
  return unwrapData(http.post('/user/list/hospitalPage', body));
}

export function auditHospital(body) {
  return unwrapData(http.post('/user/audit', body));
}

/** 关闭医院：查询参数名为 Id（首字母大写，与后端 @RequestParam 一致） */
export function closeHospital(hospitalId) {
  return unwrapData(http.post('/user/close', null, { params: { Id: hospitalId } }));
}
