/**
 * 后端返回的相对路径（如 /uploads/images/xxx.jpg）转为浏览器可访问 URL
 */
export function publicFileUrl(path) {
  if (!path) return '';
  const s = String(path).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `/api${s.startsWith('/') ? '' : '/'}${s}`;
}

/** 可作为 img src 或存入后端的图片引用：外链或本地上传路径 */
export function isStorableImageRef(s) {
  if (!s || !String(s).trim()) return false;
  const t = String(s).trim();
  if (/^https?:\/\//i.test(t)) return true;
  if (t.startsWith('/uploads/')) return true;
  return false;
}
