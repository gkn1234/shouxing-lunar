/**
 * 月球位置计算 - Moon Position Calculations
 *
 * 来源：寿星万年历 eph0.js
 * @see eph0.js:1031-1050 XL1_calc函数
 * @see eph0.js:1056-1062 m_coord函数
 * @see eph0.js:1070-1077 gxc_moonLon函数
 * @see eph0.js:1078-1085 gxc_moonLat函数
 * @see eph0.js:1173-1176 M_aLon函数
 * @see eph0.js:1206-1212 M_aLon_t函数
 *
 * 使用精密月球星历表计算月球位置
 */

import { RAD } from '../core/constants';
import { normalizeAngle, normalizeAngleSigned, SphericalCoord } from '../core/coordinate';
import { calculateLongitudeNutation } from '../core/nutation';
import { MOON_L, MOON_B, MOON_R } from '../data/vsop87/moon';
import { calculateSunApparentLongitude, calculateSunVelocity } from './sun';

/**
 * 计算月球星历级数求和
 * @see eph0.js:1031-1050 XL1_calc函数
 *
 * 使用6系数格式: A * cos(B + C*t + D*t²/10000 + E*t³/10⁸ + F*t⁴/10⁸)
 *
 * @param data - 级数数据数组 [A, B, C, D, E, F, ...]
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 级数求和结果
 */
function calculateMoonSeries(
  data: number[],
  t: number,
  termCount: number = -1
): number {
  if (data.length === 0) return 0;

  const totalTerms = Math.floor(data.length / 6);
  const n = termCount < 0 ? totalTerms : Math.min(termCount, totalTerms);

  // 预计算 t 的幂次
  // @see eph0.js:1035 t2/=1e4,t3/=1e8,t4/=1e8
  const t2 = (t * t) / 1e4;
  const t3 = (t * t * t) / 1e8;
  const t4 = (t * t * t * t) / 1e8;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const idx = i * 6;
    const A = data[idx]; // 振幅
    const B = data[idx + 1]; // 相位
    const C = data[idx + 2]; // 频率
    const D = data[idx + 3]; // t² 系数
    const E = data[idx + 4]; // t³ 系数
    const F = data[idx + 5]; // t⁴ 系数

    const phase = B + C * t + D * t2 + E * t3 + F * t4;
    sum += A * Math.cos(phase);
  }

  return sum;
}

/**
 * 计算月球黄经 (几何黄经)
 * @see eph0.js:1031-1050 XL1_calc函数 (zn=0)
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 月球黄经 (弧度)
 */
export function calculateMoonLongitude(
  t: number,
  termCount: number = -1
): number {
  // 月球平黄经基本项 (单位: 弧度)
  // @see eph0.js:1036-1037
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  // 3.81034409 ≈ 218° (J2000时刻月球平黄经)
  // 8399.684730072 弧度/世纪 ≈ 13.2°/天 (月球平均运动)
  let result =
    3.81034409 +
    8399.684730072 * t -
    3.319e-5 * t2 +
    3.11e-8 * t3 -
    2.033e-10 * t4;

  // 岁差 (角秒转弧度)
  // @see eph0.js:1037
  result +=
    (5028.792262 * t +
      1.1124406 * t2 +
      0.00007699 * t3 -
      0.000023479 * t4 -
      0.0000000178 * t5) /
    RAD;

  // 各级数贡献 (角秒转弧度)
  let tPower = 1;
  for (let i = 0; i < MOON_L.length; i++) {
    const data = MOON_L[i];
    if (data.length > 0) {
      let n = termCount;
      if (termCount > 0 && i > 0) {
        // 高次项使用较少的项数
        const ratio = (data.length / 6) / (MOON_L[0].length / 6);
        n = Math.max(3, Math.round(termCount * ratio));
      }

      const seriesSum = calculateMoonSeries(data, t, n);
      // 角秒转弧度
      result += (seriesSum / RAD) * tPower;
    }
    tPower *= t;
  }

  return normalizeAngle(result);
}

/**
 * 计算月球黄纬
 * @see eph0.js:1031-1050 XL1_calc函数 (zn=1)
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 月球黄纬 (弧度)
 */
export function calculateMoonLatitude(
  t: number,
  termCount: number = -1
): number {
  let result = 0;
  let tPower = 1;

  for (let i = 0; i < MOON_B.length; i++) {
    const data = MOON_B[i];
    if (data.length > 0) {
      let n = termCount;
      if (termCount > 0 && i > 0) {
        const ratio = (data.length / 6) / (MOON_B[0].length / 6);
        n = Math.max(3, Math.round(termCount * ratio));
      }

      const seriesSum = calculateMoonSeries(data, t, n);
      // 角秒转弧度
      result += (seriesSum / RAD) * tPower;
    }
    tPower *= t;
  }

  return result;
}

/**
 * 计算月球距离
 * @see eph0.js:1031-1050 XL1_calc函数 (zn=2)
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 月球距离 (km)
 */
export function calculateMoonDistance(
  t: number,
  termCount: number = -1
): number {
  let result = 0;
  let tPower = 1;

  for (let i = 0; i < MOON_R.length; i++) {
    const data = MOON_R[i];
    if (data.length > 0) {
      let n = termCount;
      if (termCount > 0 && i > 0) {
        const ratio = (data.length / 6) / (MOON_R[0].length / 6);
        n = Math.max(3, Math.round(termCount * ratio));
      }

      const seriesSum = calculateMoonSeries(data, t, n);
      result += seriesSum * tPower;
    }
    tPower *= t;
  }

  return result;
}

/**
 * 计算月球地心黄道坐标 (几何坐标)
 * @see eph0.js:1056-1062 m_coord函数
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param n1 - 黄经项数 (-1 表示全部)
 * @param n2 - 黄纬项数 (-1 表示全部)
 * @param n3 - 距离项数 (-1 表示全部)
 * @returns 月球地心黄道坐标 [黄经, 黄纬, 距离(km)]
 */
export function calculateMoonGeocentricCoord(
  t: number,
  n1: number = -1,
  n2: number = -1,
  n3: number = -1
): SphericalCoord {
  return [
    calculateMoonLongitude(t, n1),
    calculateMoonLatitude(t, n2),
    calculateMoonDistance(t, n3),
  ];
}

/**
 * 计算月球黄经光行差
 * @see eph0.js:1070-1077 gxc_moonLon函数
 *
 * 光行差是由于光速有限，月球运动导致的位置偏移
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 黄经光行差 (弧度)
 */
export function calculateMoonLongitudeAberration(t: number): number {
  // 月球平黄经速度 (弧度/世纪)
  const moonVelocity =
    8399.70911 +
    3.45 * Math.sin(2.87 + 8328.69 * t) +
    0.05 * Math.sin(5.19 + 7214.06 * t) +
    0.04 * Math.sin(3.51 + 16657.38 * t);

  // 光行差 = -速度 * 光行差常数
  // @see eph0.js:1076 光行差常数约 -3.4e-6 (角秒/弧度每世纪)
  // 结果以角秒为单位，需转为弧度
  const aberrationArcsec = -3.4e-6 * moonVelocity;

  return aberrationArcsec / RAD;
}

/**
 * 计算月球黄纬光行差
 * @see eph0.js:1078-1085 gxc_moonLat函数
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param lon - 月球黄经 (弧度)
 * @returns 黄纬光行差 (弧度)
 */
export function calculateMoonLatitudeAberration(t: number, lon: number): number {
  // 月球平近点角相关参数
  // @see eph0.js:1078-1084
  const a = 8399.685 * t + 5.3813;
  const b = 7214.063 * t + 4.8997;

  const latVelocity =
    518.5 * Math.sin(a) +
    -15.5 * Math.sin(2 * lon - a) +
    9.3 * Math.sin(a - b) +
    -2.6 * Math.sin(a + b);

  // 光行差 (角秒转弧度)
  const aberrationArcsec = -3.4e-6 * latVelocity;

  return aberrationArcsec / RAD;
}

/**
 * 计算月球视黄经
 * @see eph0.js:1173-1176 M_aLon函数
 *
 * 视黄经 = 几何黄经 + 章动 + 光行差
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 月球视黄经 (弧度)
 */
export function calculateMoonApparentLongitude(
  t: number,
  termCount: number = -1
): number {
  // 几何黄经
  const geoLon = calculateMoonLongitude(t, termCount);

  // 黄经章动
  const nutationLon = calculateLongitudeNutation(t);

  // 光行差
  const aberration = calculateMoonLongitudeAberration(t);

  return normalizeAngle(geoLon + nutationLon + aberration);
}

/**
 * 计算月球角速度 (黄经变化率)
 * @see eph0.js:1150-1154 M_v函数
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @returns 黄经变化率 (弧度/世纪)
 */
export function calculateMoonVelocity(t: number): number {
  const f = 8328.691424623 * t;
  // 返回弧度/世纪
  // 月球平均角速度约 8399.7 弧度/世纪 (约13°/天)
  return (
    8399.71 +
    3.45 * Math.sin(2.87 + f) +
    0.05 * Math.sin(5.19 + 7214.06 * t) +
    0.04 * Math.sin(3.51 + 16657.38 * t)
  );
}

/**
 * 已知月球视黄经反求时间
 * @see eph0.js:1206-1212 M_aLon_t函数
 *
 * 使用迭代法求解给定月球视黄经对应的时间
 *
 * @param targetLongitude - 目标视黄经 (弧度)
 * @returns 儒略世纪数 (J2000起算)
 *
 * @example
 * ```ts
 * // 求月球黄经为0°的时间
 * const t = calculateTimeFromMoonLongitude(0);
 * ```
 */
export function calculateTimeFromMoonLongitude(targetLongitude: number): number {
  const v0 = 8399.70911; // 月球平均角速度

  // 初始估计
  let t = (targetLongitude - 3.8104) / v0;

  // 迭代精化 - 使用 normalizeAngleSigned 处理角度环绕
  let v = calculateMoonVelocity(t);
  let diff = normalizeAngleSigned(targetLongitude - calculateMoonApparentLongitude(t, 10));
  t += diff / v;

  v = calculateMoonVelocity(t);
  diff = normalizeAngleSigned(targetLongitude - calculateMoonApparentLongitude(t, 60));
  t += diff / v;

  v = calculateMoonVelocity(t);
  diff = normalizeAngleSigned(targetLongitude - calculateMoonApparentLongitude(t, -1));
  t += diff / v;

  return t;
}

/**
 * 计算月球视坐标 (包含章动和光行差)
 *
 * 新增辅助函数，组合各项修正
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param termCount - 计算项数 (-1 表示全部)
 * @returns 月球视坐标 [视黄经, 视黄纬, 距离(km)]
 */
export function calculateMoonApparentCoord(
  t: number,
  termCount: number = -1
): SphericalCoord {
  const geoCoord = calculateMoonGeocentricCoord(t, termCount, termCount, termCount);

  // 视黄经
  const apparentLon = calculateMoonApparentLongitude(t, termCount);

  // 视黄纬 (加入光行差修正)
  const latAberration = calculateMoonLatitudeAberration(t, geoCoord[0]);
  const apparentLat = geoCoord[1] + latAberration;

  return [apparentLon, apparentLat, geoCoord[2]];
}

/**
 * 月球平均距离 (km)
 */
export const MOON_MEAN_DISTANCE = 384400;

/**
 * 月球平均视半径 (角秒)
 */
export const MOON_MEAN_ANGULAR_RADIUS = 931.2;

/**
 * 计算月球视半径
 *
 * 新增辅助函数，视半径与距离成反比
 *
 * @param distance - 月球距离 (km)
 * @returns 月球视半径 (弧度)
 */
export function calculateMoonAngularRadius(distance: number): number {
  // 视半径与距离成反比
  const radiusArcsec = (MOON_MEAN_ANGULAR_RADIUS * MOON_MEAN_DISTANCE) / distance;
  return radiusArcsec / RAD;
}

/**
 * 月相名称 (中文)
 */
export const MOON_PHASE_NAMES_CN = ['朔', '上弦', '望', '下弦'];

/**
 * 月相名称 (英文)
 */
export const MOON_PHASE_NAMES_EN = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];

/**
 * 计算日月视黄经差
 * @see eph0.js:1166-1168 MS_aLon函数
 *
 * 日月视黄经差 = 月球视黄经 - 太阳视黄经
 * 当差值为0时为朔(新月)，为π时为望(满月)
 *
 * @param t - 儒略世纪数 (J2000起算)
 * @param moonTermCount - 月球计算项数 (-1 表示全部)
 * @param sunTermCount - 太阳计算项数 (-1 表示全部)
 * @returns 日月视黄经差 (弧度)
 */
export function calculateMoonSunLongitudeDiff(
  t: number,
  moonTermCount: number = -1,
  sunTermCount: number = -1
): number {
  const moonLon = calculateMoonApparentLongitude(t, moonTermCount);
  const sunLon = calculateSunApparentLongitude(t, sunTermCount);

  return normalizeAngle(moonLon - sunLon);
}

/**
 * 已知日月视黄经差反求时间
 * @see eph0.js:1190-1196 MS_aLon_t函数
 *
 * 使用迭代法求解给定日月视黄经差对应的时间
 * 常用于计算朔望时刻
 *
 * @param targetDiff - 目标日月视黄经差 (弧度，0为朔，π为望)
 * @returns 儒略世纪数 (J2000起算)
 *
 * @example
 * ```ts
 * // 求朔(新月)时刻
 * const t = calculateTimeFromMoonSunDiff(0);
 * // 求望(满月)时刻
 * const t = calculateTimeFromMoonSunDiff(Math.PI);
 * ```
 */
export function calculateTimeFromMoonSunDiff(targetDiff: number): number {
  const v0 = 7771.37714500204; // 月日黄经差平均变化率

  // 初始估计
  let t = (targetDiff + 1.08472) / v0;

  // 迭代精化
  let v = calculateMoonVelocity(t) - calculateSunVelocity(t);
  let diff = normalizeAngleSigned(targetDiff - calculateMoonSunLongitudeDiff(t, 3, 3));
  t += diff / v;

  v = calculateMoonVelocity(t) - calculateSunVelocity(t);
  diff = normalizeAngleSigned(targetDiff - calculateMoonSunLongitudeDiff(t, 20, 10));
  t += diff / v;

  v = calculateMoonVelocity(t) - calculateSunVelocity(t);
  diff = normalizeAngleSigned(targetDiff - calculateMoonSunLongitudeDiff(t, -1, 60));
  t += diff / v;

  return t;
}

/**
 * 已知日月视黄经差反求时间 (低精度快速版)
 * @see eph0.js:1221-1230 MS_aLon_t2函数
 *
 * 误差不超过600秒，适合初步估算
 *
 * @param targetDiff - 目标日月视黄经差 (弧度)
 * @returns 儒略世纪数 (J2000起算)
 */
export function calculateTimeFromMoonSunDiffFast(targetDiff: number): number {
  const v0 = 7771.37714500204;

  let t = (targetDiff + 1.08472) / v0;
  const t2 = t * t;

  // 快速修正
  t -=
    (-0.00003309 * t2 +
      0.10976 * Math.cos(0.784758 + 8328.6914246 * t + 0.000152292 * t2) +
      0.02224 * Math.cos(0.1874 + 7214.0628654 * t - 0.00021848 * t2) -
      0.03342 * Math.cos(4.669257 + 628.307585 * t)) /
    v0;

  return t;
}
