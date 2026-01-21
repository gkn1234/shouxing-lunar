/**
 * Ephemeris module - 星历计算层
 *
 * 来源：寿星万年历 eph0.js
 *
 * 包含日月行星位置计算
 * @see eph0.js:955-1300 星历计算相关代码
 */

// 太阳位置计算
export {
  calculateEarthLongitude,
  calculateEarthLatitude,
  calculateEarthSunDistance,
  calculateEarthHeliocentricCoord,
  calculateSolarAberration,
  calculateSunTrueLongitude,
  calculateSunApparentLongitude,
  calculateSunGeocentricCoord,
  calculateSunVelocity,
  calculateTimeFromSunLongitude,
  calculateSolarTerms,
  SOLAR_TERM_NAMES_CN,
  SOLAR_TERM_NAMES_EN,
} from './sun';

// VSOP87 地球数据
export {
  EARTH_MULTIPLIER,
  EARTH_INDEX,
  EARTH_L,
  EARTH_B,
  EARTH_R,
} from '../data/vsop87/earth';

// 月球位置计算
export {
  calculateMoonLongitude,
  calculateMoonLatitude,
  calculateMoonDistance,
  calculateMoonGeocentricCoord,
  calculateMoonLongitudeAberration,
  calculateMoonLatitudeAberration,
  calculateMoonApparentLongitude,
  calculateMoonVelocity,
  calculateTimeFromMoonLongitude,
  calculateMoonApparentCoord,
  calculateMoonAngularRadius,
  calculateMoonSunLongitudeDiff,
  calculateTimeFromMoonSunDiff,
  calculateTimeFromMoonSunDiffFast,
  MOON_MEAN_DISTANCE,
  MOON_MEAN_ANGULAR_RADIUS,
  MOON_PHASE_NAMES_CN,
  MOON_PHASE_NAMES_EN,
} from './moon';

// 月球数据
export { MOON_L, MOON_B, MOON_R } from '../data/vsop87/moon';

// 行星位置计算
export {
  Planet,
  PLANET_NAMES_CN,
  PLANET_NAMES_EN,
  PLANET_CORRECTIONS,
  PLANET_SYNODIC_PERIODS,
  PLANET_ORBITAL_PERIODS,
  calculatePlanetHeliocentricCoord,
  calculatePlanetGeocentricCoord,
  calculatePlanetPhaseAngle,
  calculatePlanetMagnitude,
  isPlanetDirect,
  calculateLightTime,
  AU_TO_KM,
  SPEED_OF_LIGHT,
} from './planet';

// 升中天落计算
export type { RiseTransitSetResult } from './rise-transit-set';
export {
  HorizonType,
  HORIZON_CORRECTIONS,
  calculateGST,
  eclipticToEquatorial,
  equatorialToHorizontal,
  calculateHourAngle,
  calculateRefraction,
  calculateSunRiseTransitSet,
  calculateMoonRiseTransitSet,
  calculateDayLength,
  jdToTimeString,
  degreesToRadians,
  radiansToDegrees,
} from './rise-transit-set';

// 晨昏光计算
export type { TwilightTimes } from './twilight';
export {
  TwilightType,
  calculateTwilight,
  calculateCivilTwilight,
  calculateNauticalTwilight,
  calculateAstronomicalTwilight,
} from './twilight';
