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

/**
 * 救助完成并建档时：仅保留表示适合进入领养展示的健康描述。
 * 若仍在治疗/观察中，不应完成建档；编辑旧档案时 mergeLegacyStringOption 会保留库内原值选项。
 */
export const PET_HEALTH_STATUS_OPTIONS = [
  { value: '健康', label: '健康' },
  { value: '良好', label: '良好' },
  { value: '状态稳定', label: '状态稳定' },
  { value: '精神食欲良好', label: '精神食欲良好' },
  { value: '无已知疾病', label: '无已知疾病' },
  { value: '已康复', label: '已康复' },
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
