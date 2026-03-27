import { publicFileUrl } from '@/utils/publicAssetUrl';

export function petCoverUrl(p) {
  const u = p?.imageUrls?.[0];
  if (!u || !String(u).trim()) return '';
  return publicFileUrl(String(u).trim());
}

export function ageText(age) {
  if (age == null || age === '') return '年龄未知';
  return `${age} 岁`;
}

export function petLocationLine(p) {
  const d = (p?.discoverLocation || '').trim();
  if (d) return d;
  const h = (p?.hospitalAddress || '').trim();
  return h || '';
}

export function shortDesc(s) {
  if (!s) return '点击查看更多故事';
  const t = String(s).trim();
  return t.length > 42 ? `${t.slice(0, 42)}…` : t;
}
