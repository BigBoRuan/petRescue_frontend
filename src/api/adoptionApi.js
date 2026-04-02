import http, { unwrapData } from './http';

/** 提交领养申请（需登录，普通用户） */
export function adoptionApplySubmit(body) {
  return unwrapData(http.post('/adoption/apply/submit', body));
}

/** 我的申请列表 */
export function adoptionApplyMyList() {
  return unwrapData(http.get('/adoption/apply/my/list'));
}

/** 撤销我的领养申请（仅待审核） */
export function adoptionApplyMyCancel(applyId) {
  return unwrapData(http.post('/adoption/apply/my/cancel', applyId));
}

/** 我领养的宠物（分页） */
export function adoptionMyPetsPage(body) {
  return unwrapData(http.post('/adoption/record/my/page', body));
}

/** 管理端：申请分页 */
export function adoptionApplyAdminPage(body) {
  return unwrapData(http.post('/adoption/apply/admin/page', body));
}

/** 管理端：审核 */
export function adoptionApplyAudit(body) {
  return unwrapData(http.post('/adoption/apply/admin/audit', body));
}

/** 管理端：领养记录分页 */
export function adoptionRecordAdminPage(body) {
  return unwrapData(http.post('/adoption/record/admin/page', body));
}

/** 管理端：回访记录分页查询 */
export function adoptionVisitAdminPage(body) {
  return unwrapData(http.post('/adoption/visit/admin/page', body));
}

/** 管理端：提交回访 */
export function adoptionVisitComplete(body) {
  return unwrapData(http.post('/adoption/visit/complete', body));
}
