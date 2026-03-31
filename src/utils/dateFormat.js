/**
 * 后端 Jackson 可能将 Date 序列化为时间戳（毫秒）；也可能为 ISO 字符串
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

function formatD(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

/**
 * @param {number|string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (value == null || value === '') return '—';
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? '—' : formatD(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e11 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? '—' : formatD(d);
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return '—';
    if (/^\d+$/.test(t)) {
      const n = Number(t);
      const ms = n < 1e11 ? n * 1000 : n;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? '—' : formatD(d);
    }
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? t : formatD(d);
  }
  return '—';
}
