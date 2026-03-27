import { regionData, codeToText } from 'element-china-area-data';

/**
 * 将级联选中的行政区编码转为连续中文地址（与数据包 label 一致，直接拼接）
 */
export function joinCodesToAddress(pathCodes) {
  if (!pathCodes?.length) return '';
  return pathCodes.map((c) => codeToText[c] || '').join('');
}

/**
 * 根据已保存的地址字符串，反推级联 value 路径；无法识别时返回空数组
 * （直辖市为 省+区 两级；其余一般为 省+市+区 三级）
 */
export function tryParseAddressToPathCodes(address, options = regionData) {
  if (!address || typeof address !== 'string') return [];
  const addr = address.trim();
  if (!addr) return [];

  for (const prov of options) {
    if (!addr.startsWith(prov.label)) continue;
    const afterProv = addr.slice(prov.label.length);
    const cities = prov.children || [];
    if (!cities.length) return [];

    const directDistricts =
      !cities[0].children || cities[0].children.length === 0;

    if (directDistricts) {
      for (const leaf of cities) {
        if (afterProv.startsWith(leaf.label)) {
          return [prov.value, leaf.value];
        }
      }
      continue;
    }

    for (const city of cities) {
      if (!afterProv.startsWith(city.label)) continue;
      const afterCity = afterProv.slice(city.label.length);
      const districts = city.children || [];
      if (!districts.length) {
        return [prov.value, city.value];
      }
      for (const dist of districts) {
        if (afterCity.startsWith(dist.label)) {
          return [prov.value, city.value, dist.value];
        }
      }
      return [prov.value, city.value];
    }
  }
  return [];
}

export { regionData };
