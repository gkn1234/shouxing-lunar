/**
 * 月食计算 - Lunar Eclipse Calculation
 *
 * 来源：寿星万年历 eph.js
 * @see eph.js:577-663 ysPL月食计算器
 *
 * 月食发生在满月时，当地球位于太阳和月球之间，
 * 地球的影子落在月球上形成月食
 */

import {
  calculateMoonGeocentricCoord,
  calculateMoonLongitudeAberration,
  calculateMoonLatitudeAberration,
  calculateMoonVelocity,
  calculateTimeFromMoonSunDiffFast,
} from '../ephemeris/moon';
import {
  calculateEarthHeliocentricCoord,
  calculateSolarAberration,
  calculateSunVelocity,
} from '../ephemeris/sun';
import { CS_R_EARTH_AVG, CS_S_MOON, RAD, PI2, J2000 } from '../core/constants';
import { normalizeAngle, normalizeAngleSigned } from '../core/coordinate';

/**
 * 月食类型
 */
export type LunarEclipseType = 'total' | 'partial' | 'penumbral' | 'none';

/**
 * 月食时间点
 */
export interface LunarEclipseTimes {
  /** 食甚时刻 (JD) */
  maximum: number;
  /** 初亏时刻 (JD) - 本影食开始 */
  partialStart: number;
  /** 复圆时刻 (JD) - 本影食结束 */
  partialEnd: number;
  /** 半影食始 (JD) */
  penumbralStart: number;
  /** 半影食终 (JD) */
  penumbralEnd: number;
  /** 食既时刻 (JD) - 全食开始 */
  totalStart: number;
  /** 生光时刻 (JD) - 全食结束 */
  totalEnd: number;
}

/**
 * 月食信息
 */
export interface LunarEclipseInfo {
  /** 月食类型 */
  type: LunarEclipseType;
  /** 月食时间点 */
  times: LunarEclipseTimes;
  /** 食分 (0-2+, 1表示月球直径刚好被本影覆盖) */
  magnitude: number;
  /** 望(满月)的儒略日 */
  fullMoonJd: number;
  /** 月亮地心视半径 (角秒) */
  moonRadius: number;
  /** 地球本影在月球距离处的半径 (角秒) */
  umbraRadius: number;
  /** 地球半影在月球距离处的半径 (角秒) */
  penumbraRadius: number;
}

/**
 * 计算日月黄经纬差转换为基于日面中心的直角坐标 (用于月食)
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 坐标和影子半径信息
 */
function calculateEclipseCoordinates(jd: number): {
  x: number;
  y: number;
  moonRadius: number;
  umbraRadius: number;
  penumbraRadius: number;
  jd: number;
} {
  const julianCentury = jd / 36525;

  // 太阳黄道坐标 (通过地球坐标求得)
  const earthCoord = calculateEarthHeliocentricCoord(julianCentury);
  const sunLongitude = normalizeAngle(
    earthCoord[0] + Math.PI + calculateSolarAberration(julianCentury)
  );
  const sunLatitude = -earthCoord[1];
  const sunDistance = earthCoord[2];

  // 月球黄道坐标
  const moonCoord = calculateMoonGeocentricCoord(julianCentury);
  const moonLongitude = normalizeAngle(
    moonCoord[0] + calculateMoonLongitudeAberration(julianCentury)
  );
  const moonLatitude =
    moonCoord[1] + calculateMoonLatitudeAberration(julianCentury, moonCoord[0]);
  const moonDistance = moonCoord[2];

  // 视半径计算
  const moonRadius = CS_S_MOON / moonDistance; // 月亮地心视半径 (角秒)

  // 地影半径计算
  // 51/50 是大气厚度补偿系数
  const earthRadiusAtMoon = (CS_R_EARTH_AVG / moonDistance) * RAD; // 地球在月球距离处的视半径
  const sunRadiusAtMoon = (959.63 - 8.794) / sunDistance; // 太阳视半径减去视差
  const sunRadiusAtMoonPlus = (959.63 + 8.794) / sunDistance; // 太阳视半径加上视差

  const umbraRadius = (earthRadiusAtMoon - sunRadiusAtMoon) * (51 / 50); // 本影半径 (角秒)
  const penumbraRadius = (earthRadiusAtMoon + sunRadiusAtMoonPlus) * (51 / 50); // 半影半径 (角秒)

  // 日月黄经纬差转为直角坐标
  const x =
    normalizeAngleSigned(moonLongitude + Math.PI - sunLongitude) *
    Math.cos((moonLatitude - sunLatitude) / 2);
  const y = moonLatitude + sunLatitude;

  return {
    x,
    y,
    moonRadius: moonRadius / RAD, // 转为弧度
    umbraRadius: umbraRadius / RAD, // 转为弧度
    penumbraRadius: penumbraRadius / RAD, // 转为弧度
    jd,
  };
}

/**
 * 已知某时刻星体位置、速度，求到达指定距离的时间
 *
 * @param coord - 当前坐标 {x, y, jd}
 * @param vx - x方向速度
 * @param vy - y方向速度
 * @param radius - 目标距离
 * @param isSecond - 是否求第二个解 (false=入点, true=出点)
 * @returns 到达时刻的JD
 */
function calculateCrossingTime(
  coord: { x: number; y: number; jd: number },
  vx: number,
  vy: number,
  radius: number,
  isSecond: boolean
): number {
  const b = coord.y * vx - coord.x * vy;
  const A = vx * vx + vy * vy;
  const B = vx * b;
  const C = b * b - radius * radius * vy * vy;
  const D = B * B - A * C;

  if (D < 0) return 0;

  let sqrtD = Math.sqrt(D);
  if (!isSecond) sqrtD = -sqrtD;

  return coord.jd + ((-B + sqrtD) / A - coord.x) / vx;
}

/**
 * 计算月食详细信息
 *
 * @param jd - 近望的儒略日 (J2000起算，不必很精确)
 * @returns 月食信息
 */
export function calculateLunarEclipse(jd: number): LunarEclipseInfo {
  // 初始化时间数组: 食甚, 初亏, 复圆, 半影食始, 半影食终, 食既, 生光
  const times: LunarEclipseTimes = {
    maximum: 0,
    partialStart: 0,
    partialEnd: 0,
    penumbralStart: 0,
    penumbralEnd: 0,
    totalStart: 0,
    totalEnd: 0,
  };

  let type: LunarEclipseType = 'none';
  let magnitude = 0;

  // 计算低精度的望 (误差约10分钟)
  // 望时日月黄经差为180度 (π)
  const wangIndex = Math.floor((jd - 4) / 29.5306);
  const fullMoonJd = calculateTimeFromMoonSunDiffFast(wangIndex * PI2 + Math.PI) * 36525;

  // 初步计算位置和速度
  const julianCentury = fullMoonJd / 36525;

  // 月日黄纬速度差 (近似公式)
  const vy = (-18461 * Math.sin(0.057109 + 0.23089571958 * fullMoonJd) * 0.2309) / RAD;
  // 月日黄经速度差
  const vx = (calculateMoonVelocity(julianCentury) - calculateSunVelocity(julianCentury)) / 36525;

  let coord = calculateEclipseCoordinates(fullMoonJd);

  // 初步计算极值时间
  let extremeJd = fullMoonJd - (coord.y * vy + coord.x * vx) / (vy * vy + vx * vx);

  // 精密求极值 (使用差分法)
  const dt = 60 / 86400; // 1分钟
  coord = calculateEclipseCoordinates(extremeJd);
  const coordNext = calculateEclipseCoordinates(extremeJd + dt);

  const vyPrecise = (coordNext.y - coord.y) / dt;
  const vxPrecise = (coordNext.x - coord.x) / dt;
  const dtCorrection = -(coord.y * vyPrecise + coord.x * vxPrecise) / (vyPrecise * vyPrecise + vxPrecise * vxPrecise);
  extremeJd += dtCorrection;

  // 求直线到影子中心的最小距离
  const xMin = coord.x + dtCorrection * vxPrecise;
  const yMin = coord.y + dtCorrection * vyPrecise;
  const minDistance = Math.sqrt(xMin * xMin + yMin * yMin);

  // 获取最新的半径数据
  const finalCoord = calculateEclipseCoordinates(extremeJd);
  const moonRad = finalCoord.moonRadius;
  const umbraRad = finalCoord.umbraRadius;
  const penumbraRad = finalCoord.penumbraRadius;

  // 判断月球与影子的位置关系并计算各时刻
  if (minDistance <= moonRad + umbraRad) {
    // 有本影食
    times.maximum = extremeJd;
    type = 'partial';
    magnitude = (moonRad + umbraRad - minDistance) / moonRad / 2;

    // 初亏 (本影食始)
    times.partialStart = calculateCrossingTime(coord, vxPrecise, vyPrecise, moonRad + umbraRad, false);
    let tempCoord = calculateEclipseCoordinates(times.partialStart);
    times.partialStart = calculateCrossingTime(tempCoord, vxPrecise, vyPrecise, tempCoord.moonRadius + tempCoord.umbraRadius, false);

    // 复圆 (本影食终)
    times.partialEnd = calculateCrossingTime(coord, vxPrecise, vyPrecise, moonRad + umbraRad, true);
    tempCoord = calculateEclipseCoordinates(times.partialEnd);
    times.partialEnd = calculateCrossingTime(tempCoord, vxPrecise, vyPrecise, tempCoord.moonRadius + tempCoord.umbraRadius, true);
  }

  if (minDistance <= moonRad + penumbraRad) {
    // 有半影食
    if (type === 'none') {
      times.maximum = extremeJd;
      type = 'penumbral';
      magnitude = (moonRad + penumbraRad - minDistance) / moonRad / 2;
    }

    // 半影食始
    times.penumbralStart = calculateCrossingTime(coord, vxPrecise, vyPrecise, moonRad + penumbraRad, false);
    let tempCoord = calculateEclipseCoordinates(times.penumbralStart);
    times.penumbralStart = calculateCrossingTime(tempCoord, vxPrecise, vyPrecise, tempCoord.moonRadius + tempCoord.penumbraRadius, false);

    // 半影食终
    times.penumbralEnd = calculateCrossingTime(coord, vxPrecise, vyPrecise, moonRad + penumbraRad, true);
    tempCoord = calculateEclipseCoordinates(times.penumbralEnd);
    times.penumbralEnd = calculateCrossingTime(tempCoord, vxPrecise, vyPrecise, tempCoord.moonRadius + tempCoord.penumbraRadius, true);
  }

  if (minDistance <= umbraRad - moonRad) {
    // 全食
    type = 'total';

    // 食既 (全食始)
    times.totalStart = calculateCrossingTime(coord, vxPrecise, vyPrecise, umbraRad - moonRad, false);
    let tempCoord = calculateEclipseCoordinates(times.totalStart);
    times.totalStart = calculateCrossingTime(tempCoord, vxPrecise, vyPrecise, tempCoord.umbraRadius - tempCoord.moonRadius, false);

    // 生光 (全食终)
    times.totalEnd = calculateCrossingTime(coord, vxPrecise, vyPrecise, umbraRad - moonRad, true);
    tempCoord = calculateEclipseCoordinates(times.totalEnd);
    times.totalEnd = calculateCrossingTime(tempCoord, vxPrecise, vyPrecise, tempCoord.umbraRadius - tempCoord.moonRadius, true);
  }

  return {
    type,
    times,
    magnitude,
    fullMoonJd: fullMoonJd + J2000,
    moonRadius: moonRad * RAD, // 转回角秒
    umbraRadius: umbraRad * RAD,
    penumbraRadius: penumbraRad * RAD,
  };
}

/**
 * 搜索指定年份范围内的月食
 *
 * @param startYear - 开始年份
 * @param endYear - 结束年份
 * @param includeAll - 是否包含半影月食，默认只返回偏食和全食
 * @returns 月食列表
 */
export function findLunarEclipses(
  startYear: number,
  endYear: number,
  includeAll: boolean = false
): LunarEclipseInfo[] {
  const eclipses: LunarEclipseInfo[] = [];

  // 计算起止儒略日
  const startJd = (startYear - 2000) * 365.2422;
  const endJd = (endYear - 2000) * 365.2422;

  // 每29.5306天检查一次望
  let jd = startJd;
  while (jd < endJd) {
    const eclipse = calculateLunarEclipse(jd);

    if (eclipse.type !== 'none') {
      if (includeAll || eclipse.type !== 'penumbral') {
        // 检查食甚时间是否在范围内
        if (eclipse.times.maximum >= startJd && eclipse.times.maximum < endJd) {
          eclipses.push(eclipse);
        }
      }
    }

    jd += 29.5306; // 下一个望
  }

  return eclipses;
}

/**
 * 查找下一次月食
 *
 * @param jd - 起始儒略日 (J2000起算)
 * @param includeAll - 是否包含半影月食
 * @returns 下一次月食信息
 */
export function findNextLunarEclipse(
  jd: number,
  includeAll: boolean = false
): LunarEclipseInfo {
  let currentJd = jd;

  while (true) {
    const eclipse = calculateLunarEclipse(currentJd);

    if (eclipse.type !== 'none') {
      if (includeAll || eclipse.type !== 'penumbral') {
        if (eclipse.times.maximum > jd) {
          return eclipse;
        }
      }
    }

    currentJd += 29.5306;
  }
}

/**
 * 将月食时间从J2000儒略日转换为绝对儒略日
 *
 * @param times - 月食时间点
 * @returns 转换后的时间点
 */
export function convertToAbsoluteJd(times: LunarEclipseTimes): LunarEclipseTimes {
  return {
    maximum: times.maximum ? times.maximum + J2000 : 0,
    partialStart: times.partialStart ? times.partialStart + J2000 : 0,
    partialEnd: times.partialEnd ? times.partialEnd + J2000 : 0,
    penumbralStart: times.penumbralStart ? times.penumbralStart + J2000 : 0,
    penumbralEnd: times.penumbralEnd ? times.penumbralEnd + J2000 : 0,
    totalStart: times.totalStart ? times.totalStart + J2000 : 0,
    totalEnd: times.totalEnd ? times.totalEnd + J2000 : 0,
  };
}

/**
 * 获取月食类型的中文名称
 *
 * @param type - 月食类型
 * @returns 中文名称
 */
export function getLunarEclipseTypeName(type: LunarEclipseType): string {
  const names: Record<LunarEclipseType, string> = {
    total: '月全食',
    partial: '月偏食',
    penumbral: '半影月食',
    none: '无月食',
  };
  return names[type];
}
