// src/core/series.ts
/**
 * 级数计算核心模块
 * 提供 VSOP87 和月球级数的通用计算函数
 */

/**
 * VSOP87 三参数级数计算
 * @see eph0.js:955-981 XL0_calc函数
 *
 * @param data - 级数数据 [A, B, C, A, B, C, ...]
 *   - A: 振幅
 *   - B: 相位
 *   - C: 频率
 * @param t - 儒略世纪数（从J2000起算）
 * @param termCount - 计算项数（-1表示全部）
 * @returns 级数和
 */
export function calculateVSOP87Series(
  data: readonly number[],
  t: number,
  termCount: number = -1
): number {
  if (data.length === 0) return 0;

  const totalTerms = Math.floor(data.length / 3);
  const n = termCount < 0 ? totalTerms : Math.min(termCount, totalTerms);

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const idx = i * 3;
    const A = data[idx];     // 振幅
    const B = data[idx + 1]; // 相位
    const C = data[idx + 2]; // 频率
    sum += A * Math.cos(B + C * t);
  }

  return sum;
}

/**
 * 月球六参数级数计算
 * @see eph0.js:1033-1055 XL1_calc函数
 *
 * @param data - 级数数据 [A, B, C, D, E, F, A, B, C, D, E, F, ...]
 *   - A: 振幅
 *   - B: 相位
 *   - C: t¹ 系数
 *   - D: t² 系数（需除以1e4）
 *   - E: t³ 系数（需除以1e8）
 *   - F: t⁴ 系数（需除以1e8）
 * @param t - 儒略世纪数（从J2000起算）
 * @param termCount - 计算项数（-1表示全部）
 * @returns 级数和
 */
export function calculateMoonSeries(
  data: readonly number[],
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
    const A = data[idx];     // 振幅
    const B = data[idx + 1]; // 相位
    const C = data[idx + 2]; // t¹ 系数
    const D = data[idx + 3]; // t² 系数
    const E = data[idx + 4]; // t³ 系数
    const F = data[idx + 5]; // t⁴ 系数

    const phase = B + C * t + D * t2 + E * t3 + F * t4;
    sum += A * Math.cos(phase);
  }

  return sum;
}
