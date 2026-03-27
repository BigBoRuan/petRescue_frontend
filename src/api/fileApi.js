import http, { unwrapData } from './http';

/**
 * 上传图片（multipart），返回后端相对路径如 /uploads/images/xxx.jpg
 */
export function uploadImageFile(file) {
  const body = new FormData();
  body.append('file', file);
  return unwrapData(
    http.post('/file/upload', body, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }],
    })
  );
}
