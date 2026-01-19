/**
 * Astronomy module - 天文模块 (对外API)
 *
 * 来源：寿星万年历
 * 提供简化的天文计算 API，包括日月行星位置、升降时刻等
 */

import { calculateSunGeocentricCoord, calculateSolarTerms, SOLAR_TERM_NAMES_CN } from '../ephemeris/sun';
import { calculateMoonApparentCoord, calculateTimeFromMoonSunDiff, MOON_PHASE_NAMES_CN } from '../ephemeris/moon';
import {
  calculatePlanetGeocentricCoord,
  calculatePlanetPhaseAngle,
  calculatePlanetMagnitude,
  Planet,
  PLANET_NAMES_CN,
} from '../ephemeris/planet';
import {
  calculateSunRiseTransitSet,
  calculateMoonRiseTransitSet,
  eclipticToEquatorial,
  equatorialToHorizontal,
  calculateGST,
} from '../ephemeris/rise-transit-set';
import {
  calculateCivilTwilight,
  calculateNauticalTwilight,
  calculateAstronomicalTwilight,
} from '../ephemeris/twilight';
import { calculateNutation } from '../core/nutation';
import { calculateObliquity } from '../core/precession';
import { gregorianToJD, jdToGregorian } from '../core/julian';
import { calcDeltaT } from '../core/delta-t';
import { J2000, PI2, RADD } from '../core/constants';

/**
 * 观测地点
 */
export interface ObserverLocation {
  /** 经度 (度，东经为正) */
  longitude: number;
  /** 纬度 (度，北纬为正) */
  latitude: number;
  /** 海拔 (米，可选) */
  altitude?: number;
}

/**
 * 天体位置信息
 */
export interface CelestialPosition {
  /** 方位角 (度，北为0，顺时针) */
  azimuth: number;
  /** 高度角 (度，地平线为0) */
  altitude: number;
  /** 赤经 (度) */
  rightAscension: number;
  /** 赤纬 (度) */
  declination: number;
  /** 黄经 (度) */
  longitude: number;
  /** 黄纬 (度) */
  latitude: number;
  /** 距离 (AU或km，取决于天体) */
  distance: number;
}

/**
 * 日出日落时刻
 */
export interface SunTimes {
  /** 日出时刻 */
  rise: Date | null;
  /** 中天时刻 */
  transit: Date | null;
  /** 日落时刻 */
  set: Date | null;
  /** 民用晨光始（太阳在地平线下6°） */
  civilDawn: Date | null;
  /** 民用昏影终（太阳在地平线下6°） */
  civilDusk: Date | null;
  /** 航海晨光始（太阳在地平线下12°） */
  nauticalDawn: Date | null;
  /** 航海昏影终（太阳在地平线下12°） */
  nauticalDusk: Date | null;
  /** 天文晨光始（太阳在地平线下18°） */
  astronomicalDawn: Date | null;
  /** 天文昏影终（太阳在地平线下18°） */
  astronomicalDusk: Date | null;
}

/**
 * 月升月落时刻
 */
export interface MoonTimes {
  /** 月升时刻 (Date) */
  rise: Date | null;
  /** 中天时刻 (Date) */
  transit: Date | null;
  /** 月落时刻 (Date) */
  set: Date | null;
}

/**
 * 月相信息
 */
export interface MoonPhaseInfo {
  /** 月相角度 (0-360度，0=新月，180=满月) */
  phase: number;
  /** 月相名称 */
  name: string;
  /** 被照亮比例 (0-1) */
  illumination: number;
  /** 下一个新月 (Date) */
  nextNewMoon: Date;
  /** 下一个满月 (Date) */
  nextFullMoon: Date;
}

/**
 * 将日期转换为J2000儒略日
 */
function dateToJd(date: Date | string | number[]): number {
  if (date instanceof Date) {
    return (
      gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate()) +
      (date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600) / 24 -
      0.5
    );
  }
  if (typeof date === 'string') {
    const d = new Date(date);
    return (
      gregorianToJD(d.getFullYear(), d.getMonth() + 1, d.getDate()) +
      (d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600) / 24 -
      0.5
    );
  }
  if (Array.isArray(date)) {
    return gregorianToJD(date[0], date[1], date[2]);
  }
  return date;
}

/**
 * 将儒略日转换为Date对象
 */
function jdToDate(jd: number): Date {
  const dt = jdToGregorian(jd);
  return new Date(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute, Math.floor(dt.second));
}

/**
 * 获取太阳位置
 *
 * @param date - 日期时间
 * @param location - 观测地点 (可选，用于计算地平坐标)
 * @returns 太阳位置信息
 */
export function getSunPosition(date: Date | string, location?: ObserverLocation): CelestialPosition {
  const jd = dateToJd(date);
  const t = (jd - J2000) / 36525;

  // 黄道坐标
  const sunCoord = calculateSunGeocentricCoord(t);
  const eclipticLon = sunCoord[0] * RADD;
  const eclipticLat = sunCoord[1] * RADD;
  const distance = sunCoord[2];

  // 赤道坐标
  const obliquity = calculateObliquity(t);
  const nutation = calculateNutation(t);
  const trueObliquity = obliquity + nutation.obliquityNutation;

  const equatorial = eclipticToEquatorial(sunCoord, trueObliquity);
  const rightAscension = equatorial[0] * RADD;
  const declination = equatorial[1] * RADD;

  // 地平坐标
  let azimuth = 0;
  let altitude = 0;

  if (location) {
    const deltaT = calcDeltaT(jd - J2000) / 86400;
    const gst = calculateGST(jd - J2000, deltaT);
    const lonRad = (location.longitude * Math.PI) / 180;
    const latRad = (location.latitude * Math.PI) / 180;

    const horizontal = equatorialToHorizontal(equatorial, lonRad, latRad, gst);
    azimuth = horizontal[0] * RADD;
    altitude = horizontal[1] * RADD;
  }

  return {
    azimuth,
    altitude,
    rightAscension,
    declination,
    longitude: eclipticLon,
    latitude: eclipticLat,
    distance,
  };
}

/**
 * 获取月球位置
 *
 * @param date - 日期时间
 * @param location - 观测地点 (可选)
 * @returns 月球位置信息
 */
export function getMoonPosition(date: Date | string, location?: ObserverLocation): CelestialPosition {
  const jd = dateToJd(date);
  const t = (jd - J2000) / 36525;

  // 黄道坐标
  const moonCoord = calculateMoonApparentCoord(t);
  const eclipticLon = moonCoord[0] * RADD;
  const eclipticLat = moonCoord[1] * RADD;
  const distance = moonCoord[2];

  // 赤道坐标
  const obliquity = calculateObliquity(t);
  const nutation = calculateNutation(t);
  const trueObliquity = obliquity + nutation.obliquityNutation;

  const equatorial = eclipticToEquatorial(moonCoord, trueObliquity);
  const rightAscension = equatorial[0] * RADD;
  const declination = equatorial[1] * RADD;

  // 地平坐标
  let azimuth = 0;
  let altitude = 0;

  if (location) {
    const deltaT = calcDeltaT(jd - J2000) / 86400;
    const gst = calculateGST(jd - J2000, deltaT);
    const lonRad = (location.longitude * Math.PI) / 180;
    const latRad = (location.latitude * Math.PI) / 180;

    const horizontal = equatorialToHorizontal(equatorial, lonRad, latRad, gst);
    azimuth = horizontal[0] * RADD;
    altitude = horizontal[1] * RADD;
  }

  return {
    azimuth,
    altitude,
    rightAscension,
    declination,
    longitude: eclipticLon,
    latitude: eclipticLat,
    distance,
  };
}

/**
 * 获取行星位置
 *
 * @param planet - 行星 (1=水星, 2=金星, 3=火星, 4=木星, 5=土星, 6=天王星, 7=海王星, 8=冥王星)
 * @param date - 日期时间
 * @param location - 观测地点 (可选)
 * @returns 行星位置信息
 */
export function getPlanetPosition(
  planet: Planet,
  date: Date | string,
  location?: ObserverLocation
): CelestialPosition & { magnitude: number; phaseAngle: number } {
  const jd = dateToJd(date);
  const t = (jd - J2000) / 36525;

  // 地心坐标
  const coord = calculatePlanetGeocentricCoord(planet, t);
  const eclipticLon = coord[0] * RADD;
  const eclipticLat = coord[1] * RADD;
  const distance = coord[2];

  // 赤道坐标
  const obliquity = calculateObliquity(t);
  const nutation = calculateNutation(t);
  const trueObliquity = obliquity + nutation.obliquityNutation;

  const equatorial = eclipticToEquatorial(coord, trueObliquity);
  const rightAscension = equatorial[0] * RADD;
  const declination = equatorial[1] * RADD;

  // 相位角和星等
  const phaseAngle = calculatePlanetPhaseAngle(planet, t) * RADD;
  const magnitude = calculatePlanetMagnitude(planet, t);

  // 地平坐标
  let azimuth = 0;
  let altitude = 0;

  if (location) {
    const deltaT = calcDeltaT(jd - J2000) / 86400;
    const gst = calculateGST(jd - J2000, deltaT);
    const lonRad = (location.longitude * Math.PI) / 180;
    const latRad = (location.latitude * Math.PI) / 180;

    const horizontal = equatorialToHorizontal(equatorial, lonRad, latRad, gst);
    azimuth = horizontal[0] * RADD;
    altitude = horizontal[1] * RADD;
  }

  return {
    azimuth,
    altitude,
    rightAscension,
    declination,
    longitude: eclipticLon,
    latitude: eclipticLat,
    distance,
    magnitude,
    phaseAngle,
  };
}

/**
 * 获取日出日落时刻
 *
 * @param date - 日期
 * @param location - 观测地点
 * @returns 日出日落时刻
 */
export function getSunTimes(date: Date | string, location: ObserverLocation): SunTimes {
  const jd = dateToJd(date);
  const jd0 = Math.floor(jd - 0.5) + 0.5; // 当天0时
  const lonRad = (location.longitude / 180) * Math.PI;
  const latRad = (location.latitude / 180) * Math.PI;

  const result = calculateSunRiseTransitSet(jd0 - J2000, lonRad, latRad);
  const civil = calculateCivilTwilight(jd0 - J2000, lonRad, latRad);
  const nautical = calculateNauticalTwilight(jd0 - J2000, lonRad, latRad);
  const astronomical = calculateAstronomicalTwilight(jd0 - J2000, lonRad, latRad);

  return {
    rise: !isNaN(result.rise) ? jdToDate(result.rise + J2000) : null,
    transit: !isNaN(result.transit) ? jdToDate(result.transit + J2000) : null,
    set: !isNaN(result.set) ? jdToDate(result.set + J2000) : null,
    civilDawn: civil.dawn !== null ? jdToDate(civil.dawn + J2000) : null,
    civilDusk: civil.dusk !== null ? jdToDate(civil.dusk + J2000) : null,
    nauticalDawn: nautical.dawn !== null ? jdToDate(nautical.dawn + J2000) : null,
    nauticalDusk: nautical.dusk !== null ? jdToDate(nautical.dusk + J2000) : null,
    astronomicalDawn: astronomical.dawn !== null ? jdToDate(astronomical.dawn + J2000) : null,
    astronomicalDusk: astronomical.dusk !== null ? jdToDate(astronomical.dusk + J2000) : null,
  };
}

/**
 * 获取月升月落时刻
 *
 * @param date - 日期
 * @param location - 观测地点
 * @returns 月升月落时刻
 */
export function getMoonTimes(date: Date | string, location: ObserverLocation): MoonTimes {
  const jd = dateToJd(date);
  const jd0 = Math.floor(jd - 0.5) + 0.5;

  const result = calculateMoonRiseTransitSet(
    jd0 - J2000,
    (location.longitude / 180) * Math.PI,
    (location.latitude / 180) * Math.PI
  );

  return {
    rise: !isNaN(result.rise) ? jdToDate(result.rise + J2000) : null,
    transit: !isNaN(result.transit) ? jdToDate(result.transit + J2000) : null,
    set: !isNaN(result.set) ? jdToDate(result.set + J2000) : null,
  };
}

/**
 * 获取月相信息
 *
 * @param date - 日期
 * @returns 月相信息
 */
export function getMoonPhase(date: Date | string): MoonPhaseInfo {
  const jd = dateToJd(date);
  const t = (jd - J2000) / 36525;

  // 计算日月黄经差
  const sunCoord = calculateSunGeocentricCoord(t);
  const moonCoord = calculateMoonApparentCoord(t);

  let phase = (moonCoord[0] - sunCoord[0]) * RADD;
  if (phase < 0) phase += 360;

  // 被照亮比例
  const illumination = (1 - Math.cos((phase * Math.PI) / 180)) / 2;

  // 月相名称
  const phaseIndex = Math.floor(((phase + 22.5) % 360) / 45);
  const phaseNames = ['新月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
  const name = phaseNames[phaseIndex];

  // 下一个新月和满月
  const currentLunation = Math.floor((jd - J2000 + 4) / 29.5306);
  const nextNewMoonJd = calculateTimeFromMoonSunDiff((currentLunation + 1) * PI2) * 36525 + J2000;
  const nextFullMoonJd = calculateTimeFromMoonSunDiff((currentLunation + 0.5) * PI2 + Math.PI) * 36525 + J2000;

  return {
    phase,
    name,
    illumination,
    nextNewMoon: jdToDate(nextNewMoonJd > jd ? nextNewMoonJd : nextNewMoonJd + 29.5306),
    nextFullMoon: jdToDate(nextFullMoonJd > jd ? nextFullMoonJd : nextFullMoonJd + 29.5306),
  };
}

/**
 * 获取某年的节气列表
 *
 * @param year - 年份
 * @returns 节气列表 [{name, date}]
 */
export function getSolarTerms(year: number): Array<{ name: string; date: Date }> {
  const jd0 = gregorianToJD(year, 1, 1) - J2000;
  const terms = calculateSolarTerms(jd0);

  return terms.map((term, index) => ({
    name: SOLAR_TERM_NAMES_CN[index],
    date: jdToDate(term + J2000),
  }));
}

// 重新导出常用常量
export { Planet, PLANET_NAMES_CN, SOLAR_TERM_NAMES_CN, MOON_PHASE_NAMES_CN };
