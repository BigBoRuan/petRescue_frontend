import http, { unwrapData } from './http';

export function adoptList(body) {
  return unwrapData(http.post('/pet/adopt/list', body));
}

export function adoptGet(id) {
  return unwrapData(http.get('/pet/adopt/get', { params: { id: String(id) } }));
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
