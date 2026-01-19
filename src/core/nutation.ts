/**
 * 章动计算 - Nutation Calculations
 *
 * 来源：寿星万年历 eph0.js
 * @see eph0.js:496-641 章动计算相关代码
 *
 * 章动是地球自转轴的周期性摆动，影响天体的视位置
 *
 * 主要计算：
 * - 黄经章动 (Δψ): 影响天体的黄经
 * - 交角章动 (Δε): 影响黄赤交角
 */

import { RAD } from './constants';

/**
 * IAU2000B 章动序列表
 * @see eph0.js:498-584 nuTab数组
 *
 * 每行包含: l, l', F, D, Ω, A, A', A", B, B', B"
 *
 * 其中:
 * - l: 月亮平近点角系数
 * - l': 太阳平近点角系数
 * - F: 月亮升交点角距系数
 * - D: 日月角距系数
 * - Ω: 月亮升交点黄经系数
 * - A, A', A": 黄经章动系数 (0.1微角秒)
 * - B, B', B": 交角章动系数 (0.1微角秒)
 */
export const NUTATION_TABLE = [
  // l  l' F  D  Ω         A        A'      A"        B      B'     B"
  0, 0, 0, 0, 1, -172064161, -174666, 33386, 92052331, 9086, 15377,
  0, 0, 2, -2, 2, -13170906, -1675, -13696, 5730336, -3015, -4587,
  0, 0, 2, 0, 2, -2276413, -234, 2796, 978459, -485, 1374,
  0, 0, 0, 0, 2, 2074554, 207, -698, -897492, 470, -291,
  0, 1, 0, 0, 0, 1475877, -3633, 11817, 73871, -184, -1924,
  0, 1, 2, -2, 2, -516821, 1226, -524, 224386, -677, -174,
  1, 0, 0, 0, 0, 711159, 73, -872, -6750, 0, 358,
  0, 0, 2, 0, 1, -387298, -367, 380, 200728, 18, 318,
  1, 0, 2, 0, 2, -301461, -36, 816, 129025, -63, 367,
  0, -1, 2, -2, 2, 215829, -494, 111, -95929, 299, 132,
  0, 0, 2, -2, 1, 128227, 137, 181, -68982, -9, 39,
  -1, 0, 2, 0, 2, 123457, 11, 19, -53311, 32, -4,
  -1, 0, 0, 2, 0, 156994, 10, -168, -1235, 0, 82,
  1, 0, 0, 0, 1, 63110, 63, 27, -33228, 0, -9,
  -1, 0, 0, 0, 1, -57976, -63, -189, 31429, 0, -75,
  -1, 0, 2, 2, 2, -59641, -11, 149, 25543, -11, 66,
  1, 0, 2, 0, 1, -51613, -42, 129, 26366, 0, 78,
  -2, 0, 2, 0, 1, 45893, 50, 31, -24236, -10, 20,
  0, 0, 0, 2, 0, 63384, 11, -150, -1220, 0, 29,
  0, 0, 2, 2, 2, -38571, -1, 158, 16452, -11, 68,
  0, -2, 2, -2, 2, 32481, 0, 0, -13870, 0, 0,
  -2, 0, 0, 2, 0, -47722, 0, -18, 477, 0, -25,
  2, 0, 2, 0, 2, -31046, -1, 131, 13238, -11, 59,
  1, 0, 2, -2, 2, 28593, 0, -1, -12338, 10, -3,
  -1, 0, 2, 0, 1, 20441, 21, 10, -10758, 0, -3,
  2, 0, 0, 0, 0, 29243, 0, -74, -609, 0, 13,
  0, 0, 2, 0, 0, 25887, 0, -66, -550, 0, 11,
  0, 1, 0, 0, 1, -14053, -25, 79, 8551, -2, -45,
  -1, 0, 0, 2, 1, 15164, 10, 11, -8001, 0, -1,
  0, 2, 2, -2, 2, -15794, 72, -16, 6850, -42, -5,
  0, 0, -2, 2, 0, 21783, 0, 13, -167, 0, 13,
  1, 0, 0, -2, 1, -12873, -10, -37, 6953, 0, -14,
  0, -1, 0, 0, 1, -12654, 11, 63, 6415, 0, 26,
  -1, 0, 2, 2, 1, -10204, 0, 25, 5222, 0, 15,
  0, 2, 0, 0, 0, 16707, -85, -10, 168, -1, 10,
  1, 0, 2, 2, 2, -7691, 0, 44, 3268, 0, 19,
  -2, 0, 2, 0, 0, -11024, 0, -14, 104, 0, 2,
  0, 1, 2, 0, 2, 7566, -21, -11, -3250, 0, -5,
  0, 0, 2, 2, 1, -6637, -11, 25, 3353, 0, 14,
  0, -1, 2, 0, 2, -7141, 21, 8, 3070, 0, 4,
  0, 0, 0, 2, 1, -6302, -11, 2, 3272, 0, 4,
  1, 0, 2, -2, 1, 5800, 10, 2, -3045, 0, -1,
  2, 0, 2, -2, 2, 6443, 0, -7, -2768, 0, -4,
  -2, 0, 0, 2, 1, -5774, -11, -15, 3041, 0, -5,
  2, 0, 2, 0, 1, -5350, 0, 21, 2695, 0, 12,
  0, -1, 2, -2, 1, -4752, -11, -3, 2719, 0, -3,
  0, 0, 0, -2, 1, -4940, -11, -21, 2720, 0, -9,
  -1, -1, 0, 2, 0, 7350, 0, -8, -51, 0, 4,
  2, 0, 0, -2, 1, 4065, 0, 6, -2206, 0, 1,
  1, 0, 0, 2, 0, 6579, 0, -24, -199, 0, 2,
  0, 1, 2, -2, 1, 3579, 0, 5, -1900, 0, 1,
  1, -1, 0, 0, 0, 4725, 0, -6, -41, 0, 3,
  -2, 0, 2, 0, 2, -3075, 0, -2, 1313, 0, -1,
  3, 0, 2, 0, 2, -2904, 0, 15, 1233, 0, 7,
  0, -1, 0, 2, 0, 4348, 0, -10, -81, 0, 2,
  1, -1, 2, 0, 2, -2878, 0, 8, 1232, 0, 4,
  0, 0, 0, 1, 0, -4230, 0, 5, -20, 0, -2,
  -1, -1, 2, 2, 2, -2819, 0, 7, 1207, 0, 3,
  -1, 0, 2, 0, 0, -4056, 0, 5, 40, 0, -2,
  0, -1, 2, 2, 2, -2647, 0, 11, 1129, 0, 5,
  -2, 0, 0, 0, 1, -2294, 0, -10, 1266, 0, -4,
  1, 1, 2, 0, 2, 2481, 0, -7, -1062, 0, -3,
  2, 0, 0, 0, 1, 2179, 0, -2, -1129, 0, -2,
  -1, 1, 0, 1, 0, 3276, 0, 1, -9, 0, 0,
  1, 1, 0, 0, 0, -3389, 0, 5, 35, 0, -2,
  1, 0, 2, 0, 0, 3339, 0, -13, -107, 0, 1,
  -1, 0, 2, -2, 1, -1987, 0, -6, 1073, 0, -2,
  1, 0, 0, 0, 2, -1981, 0, 0, 854, 0, 0,
  -1, 0, 0, 1, 0, 4026, 0, -353, -553, 0, -139,
  0, 0, 2, 1, 2, 1660, 0, -5, -710, 0, -2,
  -1, 0, 2, 4, 2, -1521, 0, 9, 647, 0, 4,
  -1, 1, 0, 1, 1, 1314, 0, 0, -700, 0, 0,
  0, -2, 2, -2, 1, -1283, 0, 0, 672, 0, 0,
  1, 0, 2, 2, 1, -1331, 0, 8, 663, 0, 4,
  -2, 0, 2, 2, 2, 1383, 0, -2, -594, 0, -2,
  -1, 0, 0, 0, 2, 1405, 0, 4, -610, 0, 2,
  1, 1, 2, -2, 2, 1290, 0, 0, -556, 0, 0,
] as const;

/**
 * 章动计算结果
 */
export interface NutationResult {
  /** 黄经章动 Δψ (弧度) */
  longitudeNutation: number;
  /** 交角章动 Δε (弧度) */
  obliquityNutation: number;
}

/**
 * 计算章动
 * @see eph0.js:586-604 nutation函数
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @param minPeriodDays - 只计算周期大于此值(天)的项，0表示计算全部
 * @returns 章动计算结果
 *
 * @example
 * ```ts
 * // 计算 2024 年初的章动
 * const jc = (2460310.5 - 2451545) / 36525;
 * const result = calculateNutation(jc);
 * console.log(result.longitudeNutation * 180 * 3600 / Math.PI); // 黄经章动(角秒)
 * ```
 */
export function calculateNutation(julianCentury: number, minPeriodDays: number = 0): NutationResult {
  const t = julianCentury;
  const t2 = t * t;
  const t3 = t2 * t;

  // 计算基本角度参数 (弧度)
  // l: 月亮平近点角
  const moonMeanAnomaly = (485868.249036 + 1717915923.2178 * t + 31.8792 * t2 + 0.051635 * t3) / RAD;
  // l': 太阳平近点角
  const sunMeanAnomaly = (1287104.79305 + 129596581.0481 * t - 0.5532 * t2) / RAD;
  // F: 月亮升交点角距
  const moonLatitudeArg = (335779.526232 + 1739527262.8478 * t - 12.7512 * t2) / RAD;
  // D: 日月角距
  const moonElongation = (1072260.70369 + 1602961601.209 * t - 6.3706 * t2) / RAD;
  // Ω: 月亮升交点黄经
  const moonAscendingNode = (450160.398036 - 6962890.5431 * t + 7.4722 * t2) / RAD;

  // 周期筛选阈值
  const periodThreshold = minPeriodDays > 0 ? (0.00001 / minPeriodDays) : 0;

  // 累加章动项
  let longitudeNutation = 0; // 黄经章动 (0.1微角秒)
  let obliquityNutation = 0; // 交角章动 (0.1微角秒)

  const table = NUTATION_TABLE;

  for (let i = 0; i < table.length; i += 11) {
    // 计算幅角
    const argument =
      table[i] * moonMeanAnomaly +
      table[i + 1] * sunMeanAnomaly +
      table[i + 2] * moonLatitudeArg +
      table[i + 3] * moonElongation +
      table[i + 4] * moonAscendingNode;

    // 周期筛选
    if (periodThreshold > 0) {
      const coefficientSum = Math.abs(table[i]) + Math.abs(table[i + 1]) + Math.abs(table[i + 4]);
      if (coefficientSum < periodThreshold) {
        continue;
      }
    }

    // 累加黄经章动
    longitudeNutation += (table[i + 5] + table[i + 6] * t) * Math.sin(argument) + table[i + 7] * Math.cos(argument);

    // 累加交角章动
    obliquityNutation += (table[i + 8] + table[i + 9] * t) * Math.cos(argument) + table[i + 10] * Math.sin(argument);
  }

  // 转换单位：0.1微角秒 -> 弧度
  // 1角秒 = 1/3600度 = π/(180*3600)弧度
  // 0.1微角秒 = 0.0000001角秒
  const microArcSecToRad = Math.PI / (180 * 3600 * 10000000);

  return {
    longitudeNutation: longitudeNutation * microArcSecToRad,
    obliquityNutation: obliquityNutation * microArcSecToRad,
  };
}

/**
 * 中精度章动计算
 * @see eph0.js:616-636 nutB数组和nutation2函数
 *
 * 只计算主要项，速度更快
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @returns 章动计算结果
 */
export function calculateNutationApprox(julianCentury: number): NutationResult {
  const t = julianCentury;

  // 月亮升交点黄经 (度)
  const moonAscendingNodeDeg = 125.04452 - 1934.136261 * t;
  // 太阳平黄经 (度)
  const sunMeanLongitudeDeg = 280.4664567 + 360007.6982779 * t;
  // 月亮平黄经 (度)
  const moonMeanLongitudeDeg = 218.3164591 + 481267.88134236 * t;

  // 转为弧度
  const degToRad = Math.PI / 180;
  const moonAscendingNode = moonAscendingNodeDeg * degToRad;
  const sunMeanLongitude = sunMeanLongitudeDeg * degToRad;
  const moonMeanLongitude = moonMeanLongitudeDeg * degToRad;

  // 黄经章动 (角秒)
  const longitudeNutationArcSec =
    -17.2 * Math.sin(moonAscendingNode) -
    1.32 * Math.sin(2 * sunMeanLongitude) -
    0.23 * Math.sin(2 * moonMeanLongitude) +
    0.21 * Math.sin(2 * moonAscendingNode);

  // 交角章动 (角秒)
  const obliquityNutationArcSec =
    9.2 * Math.cos(moonAscendingNode) +
    0.57 * Math.cos(2 * sunMeanLongitude) +
    0.1 * Math.cos(2 * moonMeanLongitude) -
    0.09 * Math.cos(2 * moonAscendingNode);

  // 角秒转弧度
  const arcSecToRad = Math.PI / (180 * 3600);

  return {
    longitudeNutation: longitudeNutationArcSec * arcSecToRad,
    obliquityNutation: obliquityNutationArcSec * arcSecToRad,
  };
}

/**
 * 只计算黄经章动 (用于快速计算)
 * @see eph0.js:638-641 nutationLon2函数
 *
 * @param julianCentury - J2000.0 起算的儒略世纪数
 * @returns 黄经章动 (弧度)
 */
export function calculateLongitudeNutation(julianCentury: number): number {
  return calculateNutationApprox(julianCentury).longitudeNutation;
}

/**
 * 计算赤经章动和赤纬章动
 * @see eph0.js:607-611 CDnutation函数
 *
 * @param rightAscension - 赤经 (弧度)
 * @param declination - 赤纬 (弧度)
 * @param obliquity - 黄赤交角 (弧度)
 * @param longitudeNutation - 黄经章动 (弧度)
 * @param obliquityNutation - 交角章动 (弧度)
 * @returns [赤经章动, 赤纬章动] (弧度)
 */
export function calculateEquatorialNutation(
  rightAscension: number,
  declination: number,
  obliquity: number,
  longitudeNutation: number,
  obliquityNutation: number
): [number, number] {
  const sinRA = Math.sin(rightAscension);
  const cosRA = Math.cos(rightAscension);
  const tanDec = Math.tan(declination);
  const sinE = Math.sin(obliquity);
  const cosE = Math.cos(obliquity);

  // 赤经章动
  const raNutation = (cosE + sinE * sinRA * tanDec) * longitudeNutation - cosRA * tanDec * obliquityNutation;

  // 赤纬章动
  const decNutation = sinE * cosRA * longitudeNutation + sinRA * obliquityNutation;

  return [raNutation, decNutation];
}
