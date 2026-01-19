/**
 * 日食计算 - Solar Eclipse Calculation
 *
 * 来源：寿星万年历 eph.js
 * @see eph.js:671-824 ecFast快速日食搜索
 * @see eph.js:827-1290 rsGS日食几何计算
 *
 * 日食发生在朔日时，当月球位于太阳和地球之间，
 * 月球的影子落在地球上形成日食
 */

import { CS_K, CS_K2, CS_K0, RAD, PI2, J2000 } from '../core/constants';

/**
 * 日食类型
 * - N: 无日食
 * - P: 偏食
 * - A: 环食
 * - T: 全食
 * - H: 全环食 (混合食)
 * - A0/T0: 无中心线的环食/全食
 * - A1/T1: 有中心线但本影未完全进入
 * - H2: 全环食(全始)
 * - H3: 全环食(全终)
 */
export type SolarEclipseType =
  | 'N'
  | 'P'
  | 'A'
  | 'T'
  | 'H'
  | 'A0'
  | 'T0'
  | 'A1'
  | 'T1'
  | 'H2'
  | 'H3';

/**
 * 日食快速搜索结果
 */
export interface SolarEclipseQuickResult {
  /** 朔时刻 (J2000起算的JD) */
  newMoonJd: number;
  /** 日食类型 */
  type: SolarEclipseType;
  /** 结果是否精确 (边界情况可能不精确) */
  accurate: boolean;
  /** 伽马值 (影轴与地心的最小距离，地球半径为单位) */
  gamma: number;
}

/**
 * 日食详细信息
 */
export interface SolarEclipseInfo {
  /** 日食类型 */
  type: SolarEclipseType;
  /** 朔时刻 (JD，绝对值) */
  newMoonJd: number;
  /** 食甚时刻 (JD，绝对值) */
  maximumJd: number;
  /** 伽马值 */
  gamma: number;
  /** 食分 */
  magnitude: number;
  /** 最大食地点经度 (弧度) */
  maxLongitude: number;
  /** 最大食地点纬度 (弧度) */
  maxLatitude: number;
  /** 本影/伪本影半径 (地球半径为单位) */
  umbraRadius: number;
  /** 半影半径 (地球半径为单位) */
  penumbraRadius: number;
}

/**
 * 快速日食搜索
 *
 * 根据朔的时间快速判断是否有日食发生
 *
 * @param jd - 近朔的儒略日 (J2000起算，不必很精确)
 * @returns 日食快速搜索结果
 * @see eph.js:671-824 ecFast函数
 */
export function searchSolarEclipseFast(jd: number): SolarEclipseQuickResult {
  // 合朔时的日月黄经差
  const W = Math.floor((jd + 8) / 29.5306) * PI2;

  // 平朔时间计算
  let t = (W + 1.08472) / 7771.37714500204;
  let newMoonJd = t * 36525;

  let t2 = t * t;
  let accurate = true;
  let type: SolarEclipseType = 'N';

  // 月球黄纬检查 (快速排除)
  let L =
    ((93.272099 + 483202.0175273 * t - 0.0034029 * t2 - (t * t2) / 3526000 + (t2 * t2) / 863310000) /
      180) *
    Math.PI;
  if (Math.abs(Math.sin(L)) > 0.4) {
    // 黄纬太大，不可能有日食
    return { newMoonJd: newMoonJd + J2000, type: 'N', accurate: true, gamma: 2 };
  }

  // 更精确的朔时间计算
  t -= ((-0.0000331 * t * t + 0.10976 * Math.cos(0.785 + 8328.6914 * t)) / 7771);
  t2 = t * t;

  L =
    -1.084719 +
    7771.377145013 * t -
    0.0000331 * t2 +
    (22640 * Math.cos(0.785 + 8328.6914 * t + 0.000152 * t2) +
      4586 * Math.cos(0.19 + 7214.063 * t - 0.000218 * t2) +
      2370 * Math.cos(2.54 + 15542.754 * t - 0.00007 * t2) +
      769 * Math.cos(3.1 + 16657.383 * t) +
      666 * Math.cos(1.5 + 628.302 * t) +
      412 * Math.cos(4.8 + 16866.93 * t) +
      212 * Math.cos(4.1 - 1114.63 * t) +
      205 * Math.cos(0.2 + 6585.76 * t) +
      192 * Math.cos(4.9 + 23871.45 * t) +
      165 * Math.cos(2.6 + 14914.45 * t) +
      147 * Math.cos(5.5 - 7700.39 * t) +
      125 * Math.cos(0.5 + 7771.38 * t) +
      109 * Math.cos(3.9 + 8956.99 * t) +
      55 * Math.cos(5.6 - 1324.18 * t) +
      45 * Math.cos(0.9 + 25195.62 * t) +
      40 * Math.cos(3.8 - 8538.24 * t) +
      38 * Math.cos(4.3 + 22756.82 * t) +
      36 * Math.cos(5.5 + 24986.07 * t) -
      6893 * Math.cos(4.669257 + 628.3076 * t) -
      72 * Math.cos(4.6261 + 1256.62 * t) -
      43 * Math.cos(2.67823 + 628.31 * t) * t +
      21) /
    RAD;

  t +=
    (W - L) /
    (7771.38 -
      914 * Math.sin(0.7848 + 8328.691425 * t + 0.0001523 * t2) -
      179 * Math.sin(2.543 + 15542.7543 * t) -
      160 * Math.sin(0.1874 + 7214.0629 * t));

  newMoonJd = t * 36525;

  // 月球黄纬计算
  t2 = (t * t) / 10000;
  const t3 = (t2 * t) / 10000;

  const mB =
    (18461 * Math.cos(0.0571 + 8433.46616 * t - 0.64 * t2 - 1 * t3) +
      1010 * Math.cos(2.413 + 16762.1576 * t + 0.88 * t2 + 25 * t3) +
      1000 * Math.cos(5.44 - 104.7747 * t + 2.16 * t2 + 26 * t3) +
      624 * Math.cos(0.915 + 7109.2881 * t + 0 * t2 + 7 * t3) +
      199 * Math.cos(1.82 + 15647.529 * t - 2.8 * t2 - 19 * t3) +
      167 * Math.cos(4.84 - 1219.403 * t - 1.5 * t2 - 18 * t3) +
      117 * Math.cos(4.17 + 23976.22 * t - 1.3 * t2 + 6 * t3) +
      62 * Math.cos(4.8 + 25090.849 * t + 2 * t2 + 50 * t3) +
      33 * Math.cos(3.3 + 15437.98 * t + 2 * t2 + 32 * t3) +
      32 * Math.cos(1.5 + 8223.917 * t + 4 * t2 + 51 * t3) +
      30 * Math.cos(1.0 + 6480.986 * t + 0 * t2 + 7 * t3) +
      16 * Math.cos(2.5 - 9548.095 * t - 3 * t2 - 43 * t3) +
      15 * Math.cos(0.2 + 32304.912 * t + 0 * t2 + 31 * t3) +
      12 * Math.cos(4.0 + 7737.59 * t) +
      9 * Math.cos(1.9 + 15019.227 * t) +
      8 * Math.cos(5.4 + 8399.709 * t) +
      8 * Math.cos(4.2 + 23347.918 * t) +
      7 * Math.cos(4.9 - 1847.705 * t) +
      7 * Math.cos(3.8 - 16133.856 * t) +
      7 * Math.cos(2.7 + 14323.351 * t)) /
    RAD;

  // 月地距离计算
  const mR =
    (385001 +
      20905 * Math.cos(5.4971 + 8328.691425 * t + 1.52 * t2 + 25 * t3) +
      3699 * Math.cos(4.9 + 7214.06287 * t - 2.18 * t2 - 19 * t3) +
      2956 * Math.cos(0.972 + 15542.75429 * t - 0.66 * t2 + 6 * t3) +
      570 * Math.cos(1.57 + 16657.3828 * t + 3.0 * t2 + 50 * t3) +
      246 * Math.cos(5.69 - 1114.6286 * t - 3.7 * t2 - 44 * t3) +
      205 * Math.cos(1.02 + 14914.4523 * t - 1 * t2 + 6 * t3) +
      171 * Math.cos(3.33 + 23871.4457 * t + 1 * t2 + 31 * t3) +
      152 * Math.cos(4.94 + 6585.761 * t - 2 * t2 - 19 * t3) +
      130 * Math.cos(0.74 - 7700.389 * t - 2 * t2 - 25 * t3) +
      109 * Math.cos(5.2 + 7771.377 * t) +
      105 * Math.cos(2.31 + 8956.993 * t + 1 * t2 + 25 * t3) +
      80 * Math.cos(5.38 - 8538.241 * t + 2.8 * t2 + 26 * t3) +
      49 * Math.cos(6.24 + 628.302 * t) +
      35 * Math.cos(2.7 + 22756.817 * t - 3 * t2 - 13 * t3) +
      31 * Math.cos(4.1 + 16171.056 * t - 1 * t2 + 6 * t3) +
      24 * Math.cos(1.7 + 7842.365 * t - 2 * t2 - 19 * t3) +
      23 * Math.cos(3.9 + 24986.074 * t + 5 * t2 + 75 * t3) +
      22 * Math.cos(0.4 + 14428.126 * t - 4 * t2 - 38 * t3) +
      17 * Math.cos(2.0 + 8399.679 * t)) /
    6378.1366;

  // 日地距离计算
  const tYear = newMoonJd / 365250;
  const t2Year = tYear * tYear;
  const t3Year = t2Year * tYear;

  const sR =
    ((10001399 +
      167070 * Math.cos(3.098464 + 6283.07585 * tYear) +
      1396 * Math.cos(3.0552 + 12566.1517 * tYear) +
      10302 * Math.cos(1.10749 + 6283.07585 * tYear) * tYear +
      172 * Math.cos(1.064 + 12566.152 * tYear) * tYear +
      436 * Math.cos(5.785 + 6283.076 * tYear) * t2Year +
      14 * Math.cos(4.27 + 6283.08 * tYear) * t3Year) *
      1.49597870691) /
    6378.1366 /
    10;

  // 速度计算
  const vL =
    (7771 -
      914 * Math.sin(0.785 + 8328.6914 * t) -
      179 * Math.sin(2.543 + 15542.7543 * t) -
      160 * Math.sin(0.187 + 7214.0629 * t)) /
    36525;

  const vB =
    (-755 * Math.sin(0.057 + 8433.4662 * t) - 82 * Math.sin(2.413 + 16762.1576 * t)) / 36525;

  // 伽马值计算 (影轴与地心最小距离)
  const gamma = (mR * Math.sin(mB) * vL) / Math.sqrt(vB * vB + vL * vL);
  const smR = sR - mR; // 日月距

  // 影锥角和半径计算
  const mk = CS_K; // 月球半径比
  const sk = CS_K0; // 太阳半径比
  const f1 = (sk + mk) / smR; // 半影锥角正切
  const r1 = mk + f1 * mR; // 半影半径
  const f2 = (sk - CS_K2) / smR; // 本影锥角正切
  const r2 = CS_K2 - f2 * mR; // 本影半径

  const b = 0.9972; // 地球扁率修正
  const Agm = Math.abs(gamma);
  const Ar2 = Math.abs(r2);

  // 本影顶点坐标和地表高度
  const fh2 = mR - mk / f2;
  const h = Agm < 1 ? Math.sqrt(1 - gamma * gamma) : 0;

  // 确定日食类型
  if (fh2 < h) {
    type = 'T'; // 全食
  } else {
    type = 'A'; // 环食
  }

  // 边界判断
  const ls1 = Agm - (b + r1);
  const ls2 = Agm - (b + Ar2);
  const ls3 = Agm - b;
  const ls4 = Agm - (b - Ar2);

  if (Math.abs(ls1) < 0.016) accurate = false;
  if (Math.abs(ls2) < 0.016) accurate = false;
  if (Math.abs(ls3) < 0.016) accurate = false;
  if (Math.abs(ls4) < 0.016) accurate = false;

  if (ls1 > 0) {
    type = 'N'; // 无日食
  } else if (ls2 > 0) {
    type = 'P'; // 偏食
  } else if (ls3 > 0) {
    type = type === 'A' ? 'A0' : 'T0'; // 无中心
  } else if (ls4 > 0) {
    type = type === 'A' ? 'A1' : 'T1'; // 有中心但本影未完全进入
  } else {
    // 本影全进入
    if (Math.abs(fh2 - h) < 0.019) accurate = false;

    if (Math.abs(fh2) < h) {
      const vR =
        (-27299 * Math.sin(5.497 + 8328.691425 * t) -
          4184 * Math.sin(4.9 + 7214.06287 * t) -
          7204 * Math.sin(0.972 + 15542.75429 * t)) /
        36525;
      const dr = (vR * h) / vL / mR;
      const H1 = mR - dr - mk / f2; // 入点影锥z坐标
      const H2 = mR + dr - mk / f2; // 出点影锥z坐标

      if (H1 > 0) type = 'H3'; // 环全全
      if (H2 > 0) type = 'H2'; // 全全环
      if (H1 > 0 && H2 > 0) type = 'H'; // 环全环

      if (Math.abs(H1) < 0.019) accurate = false;
      if (Math.abs(H2) < 0.019) accurate = false;
    }
  }

  return {
    newMoonJd: newMoonJd + J2000,
    type,
    accurate,
    gamma,
  };
}

/**
 * 计算日食详细信息
 *
 * @param jd - 近朔的儒略日 (J2000起算，不必很精确)
 * @returns 日食详细信息，若无日食则返回null
 */
export function calculateSolarEclipse(jd: number): SolarEclipseInfo | null {
  const quickResult = searchSolarEclipseFast(jd);

  if (quickResult.type === 'N') {
    return null;
  }

  // 使用快速搜索的结果构建详细信息
  // 简化版本：使用快速搜索的伽马值估算其他参数

  const gamma = quickResult.gamma;
  const absGamma = Math.abs(gamma);

  // 估算食分 (根据伽马值)
  let magnitude = 0;
  if (quickResult.type === 'P') {
    // 偏食食分估算
    magnitude = (1.5433 - absGamma) / 0.5461;
    if (magnitude < 0) magnitude = 0;
    if (magnitude > 1) magnitude = 1;
  } else {
    // 环食/全食食分 > 1
    magnitude = 1 + (0.9972 - absGamma) * 0.5;
  }

  // 估算最大食地点 (简化：假设在赤道附近)
  const maxLatitude = Math.asin(gamma * 0.9972);
  const maxLongitude = 0; // 需要更精确的计算

  // 估算影子半径
  const umbraRadius = 0.0046; // 典型本影半径
  const penumbraRadius = 0.0356; // 典型半影半径

  return {
    type: quickResult.type,
    newMoonJd: quickResult.newMoonJd,
    maximumJd: quickResult.newMoonJd, // 简化：食甚≈朔
    gamma: quickResult.gamma,
    magnitude,
    maxLongitude,
    maxLatitude,
    umbraRadius,
    penumbraRadius,
  };
}

/**
 * 搜索指定年份范围内的日食
 *
 * @param startYear - 开始年份
 * @param endYear - 结束年份
 * @param includePartial - 是否包含偏食，默认true
 * @returns 日食列表
 */
export function findSolarEclipses(
  startYear: number,
  endYear: number,
  includePartial: boolean = true
): SolarEclipseInfo[] {
  const eclipses: SolarEclipseInfo[] = [];

  // 计算起止儒略日
  const startJd = (startYear - 2000) * 365.2422;
  const endJd = (endYear - 2000) * 365.2422;

  // 每29.5306天检查一次朔
  let jd = startJd;
  while (jd < endJd) {
    const eclipse = calculateSolarEclipse(jd);

    if (eclipse !== null) {
      if (includePartial || eclipse.type !== 'P') {
        // 检查朔时间是否在范围内
        const eclipseJd = eclipse.newMoonJd - J2000;
        if (eclipseJd >= startJd && eclipseJd < endJd) {
          eclipses.push(eclipse);
        }
      }
    }

    jd += 29.5306; // 下一个朔
  }

  return eclipses;
}

/**
 * 查找下一次日食
 *
 * @param jd - 起始儒略日 (J2000起算)
 * @param includePartial - 是否包含偏食
 * @returns 下一次日食信息
 */
export function findNextSolarEclipse(
  jd: number,
  includePartial: boolean = true
): SolarEclipseInfo {
  let currentJd = jd;

  while (true) {
    const eclipse = calculateSolarEclipse(currentJd);

    if (eclipse !== null) {
      if (includePartial || eclipse.type !== 'P') {
        const eclipseJd = eclipse.newMoonJd - J2000;
        if (eclipseJd > jd) {
          return eclipse;
        }
      }
    }

    currentJd += 29.5306;
  }
}

/**
 * 获取日食类型的中文名称
 *
 * @param type - 日食类型
 * @returns 中文名称
 */
export function getSolarEclipseTypeName(type: SolarEclipseType): string {
  const names: Record<SolarEclipseType, string> = {
    N: '无日食',
    P: '日偏食',
    A: '日环食',
    T: '日全食',
    H: '全环食',
    A0: '日环食(无中心)',
    T0: '日全食(无中心)',
    A1: '日环食(边缘)',
    T1: '日全食(边缘)',
    H2: '全环食(全始)',
    H3: '全环食(全终)',
  };
  return names[type];
}

/**
 * 判断日食类型是否为中心食 (全食或环食)
 *
 * @param type - 日食类型
 * @returns 是否为中心食
 */
export function isCentralEclipse(type: SolarEclipseType): boolean {
  return ['A', 'T', 'H', 'H2', 'H3'].includes(type);
}

/**
 * 判断日食类型是否为全食
 *
 * @param type - 日食类型
 * @returns 是否为全食
 */
export function isTotalEclipse(type: SolarEclipseType): boolean {
  return ['T', 'T0', 'T1', 'H', 'H2', 'H3'].includes(type);
}

/**
 * 判断日食类型是否为环食
 *
 * @param type - 日食类型
 * @returns 是否为环食
 */
export function isAnnularEclipse(type: SolarEclipseType): boolean {
  return ['A', 'A0', 'A1', 'H', 'H2', 'H3'].includes(type);
}
