/** 建档 / 编辑宠物档案：性别、年龄、健康状况下拉选项（与后端字符串字段一致） */

export const PET_GENDER_OPTIONS = [
  { value: '公', label: '公' },
  { value: '母', label: '母' },
  { value: '未知', label: '未知' },
];

/** 0～30 岁 */
export const PET_AGE_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i,
  label: `${i} 岁`,
}));

export const PET_HEALTH_STATUS_OPTIONS = [
  { value: '健康', label: '健康' },
  { value: '良好', label: '良好' },
  { value: '需治疗', label: '需治疗' },
  { value: '术后恢复中', label: '术后恢复中' },
  { value: '观察中', label: '观察中' },
  { value: '体弱', label: '体弱' },
  { value: '慢性病管理', label: '慢性病管理' },
];

/**
 * 编辑时若库内值不在预设列表中，补一条选项以免下拉空白
 * @param {string} current
 * @param {{ value: string, label: string }[]} baseOptions
 */
export function mergeLegacyStringOption(current, baseOptions) {
  const v = current == null ? '' : String(current).trim();
  if (!v) return baseOptions;
  if (baseOptions.some((o) => o.value === v)) return baseOptions;
  return [{ value: v, label: `${v}（原档案值）` }, ...baseOptions];
}

/**
 * @param {number|string|undefined|null} age
 */
export function mergeLegacyAgeOption(age, baseOptions = PET_AGE_OPTIONS) {
  if (age == null || age === '') return baseOptions;
  const n = Number(age);
  if (!Number.isFinite(n) || n < 0) return baseOptions;
  const rounded = Math.floor(n);
  if (baseOptions.some((o) => o.value === rounded)) return baseOptions;
  return [{ value: rounded, label: `${rounded} 岁（原档案值）` }, ...baseOptions];
}
