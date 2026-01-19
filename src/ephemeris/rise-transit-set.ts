/**
 * 升中天落计算 - Rise/Transit/Set Calculations
 *
 * 来源：寿星万年历 eph.js
 * @see eph.js:7-114 SZJ对象
 * @see eph0.js:179-193 坐标转换函数
 * @see eph0.js:650-651 大气折射修正
 * @see eph0.js:1073-1082 恒星时计算
 *
 * 计算天体的升起、中天、降落时刻
 */

import { PI2, RAD } from '../core/constants';
import { normalizeAngle, normalizeAngleSigned, SphericalCoord } from '../core/coordinate';
import { calcDeltaT } from '../core/delta-t';
import { calculateObliquity } from '../core/precession';
import { calculateSunApparentLongitude } from './sun';
import { calculateMoonApparentLongitude, calculateMoonLatitude } from './moon';

/**
 * 升中天落结果
 */
export interface RiseTransitSetResult {
  /** 升起时刻 (儒略日) */
  rise: number;
  /** 中天时刻 (儒略日) */
  transit: number;
  /** 降落时刻 (儒略日) */
  set: number;
  /** 是否极昼 (天体整日可见) */
  alwaysUp: boolean;
  /** 是否极夜 (天体整日不可见) */
  alwaysDown: boolean;
  /** 中天高度角 (弧度) */
  transitAltitude: number;
}

/**
 * 地平修正类型
 */
export enum HorizonType {
  /** 标准地平线 (-50分角，考虑大气折射和太阳视半径) */
  Standard = 0,
  /** 民用晨昏蒙影 (-6°) */
  Civil = 1,
  /** 航海晨昏蒙影 (-12°) */
  Nautical = 2,
  /** 天文晨昏蒙影 (-18°) */
  Astronomical = 3,
}

/**
 * 地平修正角度 (弧度)
 */
export const HORIZON_CORRECTIONS: Record<HorizonType, number> = {
  [HorizonType.Standard]: (-50 / 60) * (Math.PI / 180), // -50分角
  [HorizonType.Civil]: -6 * (Math.PI / 180), // -6°
  [HorizonType.Nautical]: -12 * (Math.PI / 180), // -12°
  [HorizonType.Astronomical]: -18 * (Math.PI / 180), // -18°
};

/**
 * 计算格林尼治平恒星时
 * @see eph0.js:1073-1082 pGST函数
 *
 * @param jdUT - UT时间的儒略日 (J2000起算)
 * @param deltaT - TD-UT (天)
 * @returns 格林尼治平恒星时 (弧度)
 */
export function calculateGST(jdUT: number, deltaT: number): number {
  const t = (jdUT + deltaT) / 36525; // 儒略世纪数
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;

  // 基于 IAU 2006 岁差模型
  let gst =
    PI2 * (0.779057273264 + 1.00273781191135448 * jdUT) +
    (0.014506 +
      4612.15739966 * t +
      1.39667721 * t2 -
      0.00009344 * t3 +
      0.00001882 * t4) /
      RAD;

  return normalizeAngle(gst);
}

/**
 * 黄道坐标转赤道坐标
 * @see eph0.js:179-187 llrConv函数
 *
 * @param ecliptic - 黄道坐标 [黄经, 黄纬, 距离]
 * @param obliquity - 黄赤交角 (弧度)
 * @returns 赤道坐标 [赤经, 赤纬, 距离]
 */
export function eclipticToEquatorial(
  ecliptic: SphericalCoord,
  obliquity: number
): SphericalCoord {
  const [lon, lat, dist] = ecliptic;

  const sinLon = Math.sin(lon);
  const cosLon = Math.cos(lon);
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinObl = Math.sin(obliquity);
  const cosObl = Math.cos(obliquity);

  // 赤经
  const ra = Math.atan2(sinLon * cosObl - Math.tan(lat) * sinObl, cosLon);

  // 赤纬
  const dec = Math.asin(cosObl * sinLat + sinObl * cosLat * sinLon);

  return [normalizeAngle(ra), dec, dist];
}

/**
 * 赤道坐标转地平坐标
 * @see eph0.js:188-193 CD2DP函数
 *
 * @param equatorial - 赤道坐标 [赤经, 赤纬, 距离]
 * @param longitude - 地理经度 (弧度，东正西负)
 * @param latitude - 地理纬度 (弧度)
 * @param gst - 格林尼治恒星时 (弧度)
 * @returns 地平坐标 [方位角, 高度角, 距离]
 */
export function equatorialToHorizontal(
  equatorial: SphericalCoord,
  longitude: number,
  latitude: number,
  gst: number
): SphericalCoord {
  const [ra, dec, dist] = equatorial;

  // 时角 = 恒星时 + 经度 - 赤经
  const ha = gst + longitude - ra;

  const sinHa = Math.sin(ha);
  const cosHa = Math.cos(ha);
  const sinDec = Math.sin(dec);
  const cosDec = Math.cos(dec);
  const sinLat = Math.sin(latitude);
  const cosLat = Math.cos(latitude);

  // 高度角
  const altitude = Math.asin(sinDec * sinLat + cosDec * cosLat * cosHa);

  // 方位角 (从北顺时针)
  const azimuth = Math.atan2(sinHa, cosHa * sinLat - Math.tan(dec) * cosLat);

  return [normalizeAngle(azimuth + Math.PI), altitude, dist];
}

/**
 * 计算天体升降时对应的时角
 * @see eph.js:15-21 getH函数
 *
 * @param horizonAlt - 地平高度 (弧度，负值表示地平线以下)
 * @param declination - 天体赤纬 (弧度)
 * @param latitude - 观测点纬度 (弧度)
 * @returns 时角 (弧度)，如果天体不升起或不降落则返回 NaN
 */
export function calculateHourAngle(
  horizonAlt: number,
  declination: number,
  latitude: number
): number {
  const sinH = Math.sin(horizonAlt);
  const sinLat = Math.sin(latitude);
  const cosLat = Math.cos(latitude);
  const sinDec = Math.sin(declination);
  const cosDec = Math.cos(declination);

  const cosHA = (sinH - sinLat * sinDec) / (cosLat * cosDec);

  // 检查天体是否能升起或降落
  if (Math.abs(cosHA) > 1) {
    return NaN; // 极昼或极夜
  }

  return Math.acos(cosHA);
}

/**
 * 大气折射修正 (真高度→视高度)
 * @see eph0.js:650 MQC函数
 *
 * @param trueAltitude - 真高度角 (弧度)
 * @returns 折射修正量 (弧度)
 */
export function calculateRefraction(trueAltitude: number): number {
  if (trueAltitude < 0) return 0;

  // Bennett 公式
  const h = trueAltitude;
  return 0.0002967 / Math.tan(h + 0.003138 / (h + 0.08919));
}

/**
 * 计算太阳升中天落
 * @see eph.js:55-87 St函数
 *
 * @param jd - 当地中午时刻的儒略日 (UT)
 * @param longitude - 地理经度 (弧度，东正西负)
 * @param latitude - 地理纬度 (弧度)
 * @param horizonType - 地平类型
 * @returns 升中天落结果
 */
export function calculateSunRiseTransitSet(
  jd: number,
  longitude: number,
  latitude: number,
  horizonType: HorizonType = HorizonType.Standard
): RiseTransitSetResult {
  // TD-UT 修正
  const deltaT = calcDeltaT(jd) / 86400; // 秒转天
  const t = (jd + deltaT) / 36525; // 儒略世纪数

  // 黄赤交角
  const obliquity = calculateObliquity(t);

  // 地平修正
  const horizonAlt = HORIZON_CORRECTIONS[horizonType];

  // 太阳每日角速度 (弧度/天)
  const solarVelocity = PI2;

  // 初始化：找到当天中午附近
  let jdTransit = jd - normalizeAngleSigned(jd * PI2 + longitude) / PI2;

  // 迭代计算中天时刻
  for (let iter = 0; iter < 3; iter++) {
    const tIter = (jdTransit + deltaT) / 36525;
    const sunLon = calculateSunApparentLongitude(tIter);
    const sunCoord: SphericalCoord = [sunLon, 0, 1];
    const eqCoord = eclipticToEquatorial(sunCoord, obliquity);

    const gst = calculateGST(jdTransit, deltaT);
    const ha = normalizeAngleSigned(gst + longitude - eqCoord[0]);

    jdTransit -= ha / solarVelocity;
  }

  // 计算中天时刻的太阳赤纬
  const tTransit = (jdTransit + deltaT) / 36525;
  const sunLonTransit = calculateSunApparentLongitude(tTransit);
  const sunCoordTransit: SphericalCoord = [sunLonTransit, 0, 1];
  const eqCoordTransit = eclipticToEquatorial(sunCoordTransit, obliquity);
  const declination = eqCoordTransit[1];

  // 中天高度角
  const transitAltitude = Math.PI / 2 - Math.abs(latitude - declination);

  // 计算时角
  const hourAngle = calculateHourAngle(horizonAlt, declination, latitude);

  // 检查极昼极夜
  if (isNaN(hourAngle)) {
    const isUp = transitAltitude > horizonAlt;
    return {
      rise: NaN,
      transit: jdTransit,
      set: NaN,
      alwaysUp: isUp,
      alwaysDown: !isUp,
      transitAltitude,
    };
  }

  // 升起和降落时刻
  const halfDay = hourAngle / solarVelocity;
  const jdRise = jdTransit - halfDay;
  const jdSet = jdTransit + halfDay;

  return {
    rise: jdRise,
    transit: jdTransit,
    set: jdSet,
    alwaysUp: false,
    alwaysDown: false,
    transitAltitude,
  };
}

/**
 * 计算月球升中天落
 * @see eph.js:23-53 Mt函数
 *
 * @param jd - 当地中午时刻的儒略日 (UT)
 * @param longitude - 地理经度 (弧度，东正西负)
 * @param latitude - 地理纬度 (弧度)
 * @returns 升中天落结果
 */
export function calculateMoonRiseTransitSet(
  jd: number,
  longitude: number,
  latitude: number
): RiseTransitSetResult {
  // TD-UT 修正
  const deltaT = calcDeltaT(jd) / 86400;
  const t = (jd + deltaT) / 36525;

  // 黄赤交角
  const obliquity = calculateObliquity(t);

  // 月球地平修正 (考虑视半径和视差)
  // 月球视半径约 15.5分角，视差约 57分角
  const moonHorizonAlt = (-50 / 60 + 57 / 60 - 15.5 / 60) * (Math.PI / 180);

  // 月球每日角速度 (弧度/天) - 比太阳慢
  const moonVelocity = PI2 * 0.9661;

  // 初始化：找到当天中午附近
  let jdTransit = jd - normalizeAngleSigned(jd * PI2 + longitude) / PI2;

  // 迭代计算中天时刻
  for (let iter = 0; iter < 3; iter++) {
    const tIter = (jdTransit + deltaT) / 36525;
    const moonLon = calculateMoonApparentLongitude(tIter);
    const moonLat = calculateMoonLatitude(tIter);
    const moonCoord: SphericalCoord = [moonLon, moonLat, 1];
    const eqCoord = eclipticToEquatorial(moonCoord, obliquity);

    const gst = calculateGST(jdTransit, deltaT);
    const ha = normalizeAngleSigned(gst + longitude - eqCoord[0]);

    jdTransit -= ha / moonVelocity;
  }

  // 计算中天时刻的月球赤纬
  const tTransit = (jdTransit + deltaT) / 36525;
  const moonLonTransit = calculateMoonApparentLongitude(tTransit);
  const moonLatTransit = calculateMoonLatitude(tTransit);
  const moonCoordTransit: SphericalCoord = [moonLonTransit, moonLatTransit, 1];
  const eqCoordTransit = eclipticToEquatorial(moonCoordTransit, obliquity);
  const declination = eqCoordTransit[1];

  // 中天高度角
  const transitAltitude = Math.PI / 2 - Math.abs(latitude - declination);

  // 计算时角 (使用月球地平修正)
  const hourAngle = calculateHourAngle(moonHorizonAlt, declination, latitude);

  // 检查极昼极夜
  if (isNaN(hourAngle)) {
    const isUp = transitAltitude > moonHorizonAlt;
    return {
      rise: NaN,
      transit: jdTransit,
      set: NaN,
      alwaysUp: isUp,
      alwaysDown: !isUp,
      transitAltitude,
    };
  }

  // 升起和降落时刻
  const halfDay = hourAngle / moonVelocity;
  const jdRise = jdTransit - halfDay;
  const jdSet = jdTransit + halfDay;

  return {
    rise: jdRise,
    transit: jdTransit,
    set: jdSet,
    alwaysUp: false,
    alwaysDown: false,
    transitAltitude,
  };
}

/**
 * 计算昼长
 *
 * 新增辅助函数
 *
 * @param rts - 升中天落结果
 * @returns 昼长 (天)，极昼返回1，极夜返回0
 */
export function calculateDayLength(rts: RiseTransitSetResult): number {
  if (rts.alwaysUp) return 1;
  if (rts.alwaysDown) return 0;
  return rts.set - rts.rise;
}

/**
 * 儒略日转时间字符串 (HH:MM:SS)
 *
 * 新增辅助函数
 *
 * @param jd - 儒略日
 * @returns 时间字符串
 */
export function jdToTimeString(jd: number): string {
  if (isNaN(jd)) return '--:--:--';

  const dayFraction = (jd + 0.5) % 1;
  let totalSeconds = Math.round(dayFraction * 86400);

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds -= hours * 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * 度数转弧度 (新增辅助函数)
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 弧度转度数 (新增辅助函数)
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}
