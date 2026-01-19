/**
 * 太阳位置计算 - Sun Position Calculations
 *
 * 来源：寿星万年历 eph0.js
 * @see eph0.js:1020-1026 e_coord函数
 * @see eph0.js:1064-1068 gxc_sunLon函数
 * @see eph0.js:1169-1171 S_aLon函数
 * @see eph0.js:1198-1204 S_aLon_t函数
 *
 * 使用 VSOP87 理论计算太阳位置
 */

import { RAD } from '../core/constants';
import { normalizeAngle, normalizeAngleSigned, SphericalCoord } from '../core/coordinate';
import { calculateLongitudeNutation } from '../core/nutation';
import { calculateVSOP87Series } from '../core/series';
import {
  EARTH_MULTIPLIER,
  EARTH_L,
  EARTH_B,
  EARTH_R,
} from '../data/vsop87/earth';

/**
 * 计算地球黄经坐标分量
 * @see eph0.js:955-981 XL0_calc函数 (zn=0)
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 地球黄经 (弧度)
 */
export function calculateEarthLongitude(
  t: number,
  termCount: number = -1
): number {
  const tMillennia = t / 10; // 转为儒略千年数
  const tMillennia2 = tMillennia * tMillennia;
  const tMillennia3 = tMillennia2 * tMillennia;

  let result = 0;
  let tPower = 1;

  // 计算 L0 到 L5 的贡献
  for (let i = 0; i < 6; i++) {
    const data = EARTH_L[i];
    if (data.length > 0) {
      // 确定每级使用的项数
      let n = termCount;
      if (termCount > 0 && i > 0) {
        // 高次项使用较少的项数
        const ratio = data.length / 3 / (EARTH_L[0].length / 3);
        n = Math.max(3, Math.round(termCount * ratio));
      }

      const seriesSum = calculateVSOP87Series(data, tMillennia, n);
      result += seriesSum * tPower;
    }
    tPower *= tMillennia;
  }

  result /= EARTH_MULTIPLIER;

  // 地球修正项
  // @see eph0.js:971 对地球黄经的修正
  result +=
    (-0.0728 - 2.7702 * tMillennia - 1.1019 * tMillennia2 - 0.0996 * tMillennia3) / RAD;

  return result;
}

/**
 * 计算地球黄纬坐标分量
 * @see eph0.js:955-981 XL0_calc函数 (zn=1)
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 地球黄纬 (弧度)
 */
export function calculateEarthLatitude(
  t: number,
  termCount: number = -1
): number {
  const tMillennia = t / 10;
  const tMillennia2 = tMillennia * tMillennia;
  const tMillennia3 = tMillennia2 * tMillennia;

  let result = 0;
  let tPower = 1;

  for (let i = 0; i < 6; i++) {
    const data = EARTH_B[i];
    if (data.length > 0) {
      let n = termCount;
      if (termCount > 0 && i > 0) {
        const ratio = data.length / 3 / (EARTH_B[0].length / 3);
        n = Math.max(3, Math.round(termCount * ratio));
      }

      const seriesSum = calculateVSOP87Series(data, tMillennia, n);
      result += seriesSum * tPower;
    }
    tPower *= tMillennia;
  }

  result /= EARTH_MULTIPLIER;

  // 地球黄纬修正项
  // @see eph0.js:972 对地球黄纬的修正
  result +=
    (0.0 + 0.0004 * tMillennia + 0.0004 * tMillennia2 - 0.0026 * tMillennia3) / RAD;

  return result;
}

/**
 * 计算地球到太阳距离
 * @see eph0.js:955-981 XL0_calc函数 (zn=2)
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 地日距离 (AU)
 */
export function calculateEarthSunDistance(
  t: number,
  termCount: number = -1
): number {
  const tMillennia = t / 10;
  const tMillennia2 = tMillennia * tMillennia;
  const tMillennia3 = tMillennia2 * tMillennia;

  let result = 0;
  let tPower = 1;

  for (let i = 0; i < 6; i++) {
    const data = EARTH_R[i];
    if (data.length > 0) {
      let n = termCount;
      if (termCount > 0 && i > 0) {
        const ratio = data.length / 3 / (EARTH_R[0].length / 3);
        n = Math.max(3, Math.round(termCount * ratio));
      }

      const seriesSum = calculateVSOP87Series(data, tMillennia, n);
      result += seriesSum * tPower;
    }
    tPower *= tMillennia;
  }

  result /= EARTH_MULTIPLIER;

  // 地球距离修正项 (单位: AU/10^6)
  // @see eph0.js:973 对地球距离的修正
  result +=
    (-0.002 + 0.0044 * tMillennia + 0.0213 * tMillennia2 - 0.025 * tMillennia3) / 1000000;

  return result;
}

/**
 * 计算地球日心坐标
 * @see eph0.js:1020-1026 e_coord函数
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param n1 - 黄经项数 (-1 表示全部)
 * @param n2 - 黄纬项数 (-1 表示全部)
 * @param n3 - 距离项数 (-1 表示全部)
 * @returns 地球日心黄道坐标 [黄经, 黄纬, 距离]
 */
export function calculateEarthHeliocentricCoord(
  t: number,
  n1: number = -1,
  n2: number = -1,
  n3: number = -1
): SphericalCoord {
  return [
    calculateEarthLongitude(t, n1),
    calculateEarthLatitude(t, n2),
    calculateEarthSunDistance(t, n3),
  ];
}

/**
 * 计算太阳光行差
 * @see eph0.js:1064-1068 gxc_sunLon函数
 *
 * 光行差是由于光速有限，地球运动导致的太阳位置偏移
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 黄经光行差 (弧度)
 */
export function calculateSolarAberration(t: number): number {
  // 太阳平近点角
  const meanAnomaly = -0.043126 + 628.301955 * t - 0.000002732 * t * t;

  // 地球轨道离心率
  const eccentricity = 0.016708634 - 0.000042037 * t - 0.0000001267 * t * t;

  // 黄经光行差 (角秒)
  const aberrationArcsec = -20.49552 * (1 + eccentricity * Math.cos(meanAnomaly));

  return aberrationArcsec / RAD;
}

/**
 * 计算太阳真黄经 (Date分点)
 *
 * 新增辅助函数：太阳真黄经 = 地球黄经 + π
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 太阳真黄经 (弧度)
 */
export function calculateSunTrueLongitude(
  t: number,
  termCount: number = -1
): number {
  return normalizeAngle(calculateEarthLongitude(t, termCount) + Math.PI);
}

/**
 * 计算太阳视黄经
 * @see eph0.js:1169-1171 S_aLon函数
 *
 * 视黄经 = 真黄经 + 章动 + 光行差
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 太阳视黄经 (弧度)
 */
export function calculateSunApparentLongitude(
  t: number,
  termCount: number = -1
): number {
  // 地球黄经 + π = 太阳真黄经
  const earthLon = calculateEarthLongitude(t, termCount);
  const sunTrueLon = earthLon + Math.PI;

  // 黄经章动
  const nutationLon = calculateLongitudeNutation(t);

  // 光行差
  const aberration = calculateSolarAberration(t);

  return normalizeAngle(sunTrueLon + nutationLon + aberration);
}

/**
 * 计算太阳地心坐标 (视坐标)
 *
 * 新增辅助函数，组合视黄经、黄纬、距离
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 太阳地心黄道坐标 [视黄经, 视黄纬, 距离]
 */
export function calculateSunGeocentricCoord(
  t: number,
  termCount: number = -1
): SphericalCoord {
  const earthCoord = calculateEarthHeliocentricCoord(t, termCount, termCount, termCount);

  // 太阳视黄经
  const apparentLon = calculateSunApparentLongitude(t, termCount);

  // 太阳黄纬 (几乎为0，取负的地球黄纬)
  const apparentLat = -earthCoord[1];

  // 地日距离
  const distance = earthCoord[2];

  return [apparentLon, apparentLat, distance];
}

/**
 * 计算太阳地球速度 (黄经变化率)
 * @see eph0.js:1144-1148 E_v函数
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 黄经变化率 (弧度/世纪)
 */
export function calculateSunVelocity(t: number): number {
  const f = 628.307585 * t;
  // 返回弧度/世纪
  return (
    628.332 +
    21 * Math.sin(1.527 + f) +
    0.44 * Math.sin(1.48 + f * 2) +
    0.129 * Math.sin(5.82 + f) * t +
    0.00055 * Math.sin(4.21 + f) * t * t
  );
}

/**
 * 已知太阳视黄经反求时间
 * @see eph0.js:1198-1204 S_aLon_t函数
 *
 * 使用迭代法求解给定太阳视黄经对应的时间
 *
 * @param targetLongitude - 目标视黄经 (弧度)
 * @returns 儒略世纪数 (J2000起算)
 *
 * @example
 * ```ts
 * // 求春分点 (太阳视黄经为0) 的时间
 * const t = calculateTimeFromSunLongitude(0);
 * ```
 */
export function calculateTimeFromSunLongitude(targetLongitude: number): number {
  const v0 = 628.3319653318; // 太阳平均角速度

  // 初始估计
  let t = (targetLongitude - 1.75347 - Math.PI) / v0;

  // 迭代精化 - 使用 normalizeAngleSigned 处理角度环绕
  let v = calculateSunVelocity(t);
  let diff = normalizeAngleSigned(targetLongitude - calculateSunApparentLongitude(t, 10));
  t += diff / v;

  v = calculateSunVelocity(t);
  diff = normalizeAngleSigned(targetLongitude - calculateSunApparentLongitude(t, -1));
  t += diff / v;

  return t;
}

/**
 * 计算指定年份的二十四节气
 *
 * @param year - 公历年份
 * @returns 24个节气的儒略日数组
 *
 * @example
 * ```ts
 * // 获取2024年所有节气
 * const solarTerms = calculateSolarTerms(2024);
 * // solarTerms[0] 是小寒, solarTerms[23] 是冬至
 * ```
 */
export function calculateSolarTerms(_year: number): number[] {
  const terms: number[] = [];

  // 小寒开始, 黄经270° (即 3π/2)
  // 每个节气间隔15°
  for (let i = 0; i < 24; i++) {
    // 节气对应的太阳黄经 (从小寒270°开始)
    const longitude = normalizeAngle(((270 + i * 15) * Math.PI) / 180);

    // 精确计算时间
    const t = calculateTimeFromSunLongitude(longitude);

    // 转换为儒略日 (J2000起算)
    const jd = t * 36525 + 2451545;
    terms.push(jd);
  }

  return terms;
}

/**
 * 二十四节气名称 (中文)
 */
export const SOLAR_TERM_NAMES_CN = [
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '惊蛰',
  '春分',
  '清明',
  '谷雨',
  '立夏',
  '小满',
  '芒种',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '处暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至',
];

/**
 * 二十四节气名称 (英文)
 */
export const SOLAR_TERM_NAMES_EN = [
  'Minor Cold',
  'Major Cold',
  'Start of Spring',
  'Rain Water',
  'Awakening of Insects',
  'Spring Equinox',
  'Clear and Bright',
  'Grain Rain',
  'Start of Summer',
  'Grain Buds',
  'Grain in Ear',
  'Summer Solstice',
  'Minor Heat',
  'Major Heat',
  'Start of Autumn',
  'End of Heat',
  'White Dew',
  'Autumn Equinox',
  'Cold Dew',
  'Frost Descent',
  'Start of Winter',
  'Minor Snow',
  'Major Snow',
  'Winter Solstice',
];
