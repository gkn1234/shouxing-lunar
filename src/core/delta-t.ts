/**
 * ΔT (Delta T) 时差计算 - TD-UT1 Calculation
 *
 * 来源：寿星万年历 eph0.js
 * @see eph0.js:218-272 ΔT计算相关代码
 *
 * ΔT = TT - UT1 (地球时与世界时之差)
 *
 * TT (Terrestrial Time) 地球时，原子钟时间
 * UT1 (Universal Time 1) 世界时，基于地球自转
 * 由于地球自转不均匀，两者存在差异
 */

/**
 * ΔT 计算表
 * @see eph0.js:218-253 dt_at数组
 *
 * 每行包含: 年份, a0, a1, a2, a3 (多项式系数)
 * 使用三次多项式拟合: ΔT = a0 + a1*t + a2*t² + a3*t³
 * 其中 t = (year - 起始年) / (结束年 - 起始年) * 10
 */
export const DELTA_T_TABLE: number[] = [
  -4000, 108371.7, -13036.8, 392.0, 0.0,
  -500, 17201.0, -627.82, 16.17, -0.3413,
  -150, 12200.6, -346.41, 5.403, -0.1593,
  150, 9113.8, -328.13, -1.647, 0.0377,
  500, 5707.5, -391.41, 0.915, 0.3145,
  900, 2203.4, -283.45, 13.034, -0.1778,
  1300, 490.1, -57.35, 2.085, -0.0072,
  1600, 120.0, -9.81, -1.532, 0.1403,
  1700, 10.2, -0.91, 0.51, -0.037,
  1800, 13.4, -0.72, 0.202, -0.0193,
  1830, 7.8, -1.81, 0.416, -0.0247,
  1860, 8.3, -0.13, -0.406, 0.0292,
  1880, -5.4, 0.32, -0.183, 0.0173,
  1900, -2.3, 2.06, 0.169, -0.0135,
  1920, 21.2, 1.69, -0.304, 0.0167,
  1940, 24.2, 1.22, -0.064, 0.0031,
  1960, 33.2, 0.51, 0.231, -0.0109,
  1980, 51.0, 1.29, -0.026, 0.0032,
  2000, 63.87, 0.1, 0, 0,
  2005, 64.7, 0.21, 0, 0,
  2012, 66.8, 0.22, 0, 0,
  // 使用 skyfield 的 DE440s ΔT 预测数据拟合
  2016, 68.1024, 0.5456, -0.0542, -0.001172,
  2020, 69.3612, 0.0422, -0.0502, 0.006216,
  2024, 69.1752, -0.0335, -0.0048, 0.000811,
  2028, 69.0206, -0.0275, 0.0055, -0.000014,
  2032, 68.9981, 0.0163, 0.0054, 0.000006,
  2036, 69.1498, 0.0599, 0.0053, 0.000026,
  2040, 69.4751, 0.1035, 0.0051, 0.000046,
  2044, 69.9737, 0.1469, 0.005, 0.000066,
  2048, 70.6451, 0.1903, 0.0049, 0.000085,
  2050, 71.0457,
];

/**
 * 二次曲线外推计算 ΔT
 * @see eph0.js:255 dt_ext函数
 *
 * @param year - 年份
 * @param secularAcceleration - 长期加速度估计值 (默认31)
 * @returns ΔT (秒)
 */
function extrapolateDeltaT(year: number, secularAcceleration: number): number {
  const centuriesFrom1820 = (year - 1820) / 100;
  return -20 + secularAcceleration * centuriesFrom1820 * centuriesFrom1820;
}

/**
 * 计算世界时与原子时之差 (ΔT = TT - UT1)
 * @see eph0.js:256-271 dt_calc函数
 *
 * @param year - 年份 (可含小数表示年内时刻)
 * @returns ΔT (秒)
 *
 * @example
 * ```ts
 * // 计算2024年的ΔT
 * calcDeltaT(2024) // => ~69秒
 *
 * // 计算2000年年中的ΔT
 * calcDeltaT(2000.5) // => ~63.9秒
 * ```
 */
export function calcDeltaT(year: number): number {
  const table = DELTA_T_TABLE;
  const tableLastYear = table[table.length - 2];
  const tableLastDeltaT = table[table.length - 1];

  // 表格范围外的年份使用外推
  if (year >= tableLastYear) {
    // secularAcceleration 是表格最后年份之后的加速度估计
    // 瑞士星历表 = 31, NASA网站 = 32, skmap = 29
    const secularAcceleration = 31;

    if (year > tableLastYear + 100) {
      return extrapolateDeltaT(year, secularAcceleration);
    }

    // 渐进过渡：在表格边界和外推之间平滑过渡
    const extrapolatedValue = extrapolateDeltaT(year, secularAcceleration);
    const boundaryDifference = extrapolateDeltaT(tableLastYear, secularAcceleration) - tableLastDeltaT;
    const transitionFactor = (tableLastYear + 100 - year) / 100;
    return extrapolatedValue - boundaryDifference * transitionFactor;
  }

  // 在表格范围内，使用三次多项式插值
  let tableIndex: number;
  for (tableIndex = 0; tableIndex < table.length; tableIndex += 5) {
    if (year < table[tableIndex + 5]) {
      break;
    }
  }

  // 计算归一化时间参数
  const segmentStartYear = table[tableIndex];
  const segmentEndYear = table[tableIndex + 5];
  const normalizedTime = ((year - segmentStartYear) / (segmentEndYear - segmentStartYear)) * 10;
  const normalizedTime2 = normalizedTime * normalizedTime;
  const normalizedTime3 = normalizedTime2 * normalizedTime;

  // 三次多项式插值
  const coeff0 = table[tableIndex + 1];
  const coeff1 = table[tableIndex + 2];
  const coeff2 = table[tableIndex + 3];
  const coeff3 = table[tableIndex + 4];

  return coeff0 + coeff1 * normalizedTime + coeff2 * normalizedTime2 + coeff3 * normalizedTime3;
}

/**
 * 从 J2000 起算的儒略日计算 ΔT
 * @see eph0.js:272 dt_T函数
 *
 * @param julianDayFromJ2000 - 儒略日 (J2000起算)
 * @returns ΔT (日)
 *
 * @example
 * ```ts
 * // 将儒略日转换为年份再计算ΔT
 * deltaTFromJD(0) // => 2000年的ΔT，约63.87秒 / 86400 日
 * ```
 */
export function deltaTFromJD(julianDayFromJ2000: number): number {
  const year = julianDayFromJ2000 / 365.2425 + 2000;
  return calcDeltaT(year) / 86400.0;
}

/**
 * 将 UT (世界时) 转换为 TD (力学时/地球时)
 *
 * @param julianDayUT - UT 的儒略日
 * @returns TD 的儒略日
 */
export function utToTD(julianDayUT: number): number {
  const year = (julianDayUT - 2451545) / 365.2425 + 2000;
  return julianDayUT + calcDeltaT(year) / 86400;
}

/**
 * 将 TD (力学时/地球时) 转换为 UT (世界时)
 *
 * @param julianDayTD - TD 的儒略日
 * @returns UT 的儒略日 (近似值)
 */
export function tdToUT(julianDayTD: number): number {
  const year = (julianDayTD - 2451545) / 365.2425 + 2000;
  return julianDayTD - calcDeltaT(year) / 86400;
}
