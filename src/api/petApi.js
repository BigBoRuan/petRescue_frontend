import http, { unwrapData } from './http';

export function adoptList(body) {
  return unwrapData(http.post('/pet/adopt/list', body));
}

export function adoptGet(id) {
  return unwrapData(http.get('/pet/adopt/get', { params: { id: String(id) } }));
}

/** 可领养宠物数量最多的医院 TOP N（无需登录） */
export function adoptHospitalRank(limit = 5) {
  return unwrapData(http.get('/pet/adopt/hospital/rank', { params: { limit } }));
}

/** 用户端医院介绍（已通过审核，无需登录） */
export function adoptHospitalPublic(id) {
  return unwrapData(http.get('/pet/adopt/hospital/public', { params: { id: String(id) } }));
}

export function petInfoPage(body) {
  return unwrapData(http.post('/pet/info/page', body));
}

export function petInfoGet(id) {
  return unwrapData(http.get('/pet/info/get', { params: { id: String(id) } }));
}

export function petInfoUpdate(body) {
  return unwrapData(http.post('/pet/info/update', body));
}

export function petInfoDelete(body) {
  return unwrapData(http.post('/pet/info/delete', body));
}

export function rescueReportAdd(body) {
  return unwrapData(http.post('/pet/rescue/report/add', body));
}

export function rescueReportPage(body) {
  return unwrapData(http.post('/pet/rescue/report/page', body));
}

export function rescueReportDetail(id) {
  return unwrapData(http.get('/pet/rescue/report/detail', { params: { id } }));
}

export function rescueComplete(body) {
  return unwrapData(http.post('/pet/rescue/complete', body));
}
