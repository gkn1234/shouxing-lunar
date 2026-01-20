/**
 * @yhjs/lunar - Chinese lunar calendar and astronomical calculations library
 *
 * 寿星万年历算法 TypeScript 实现
 *
 * 模块说明：
 * - core: 核心数学函数和常量
 * - lunar: 农历计算（日期转换、干支、节气等）
 * - ephemeris: 天文历表（日月行星位置计算）
 * - eclipse: 日月食计算
 * - astronomy: 简化天文API（用户友好接口）
 * - data: 数据模块（城市坐标、历史纪年等）
 */

// 核心模块
export * from './core';

// 农历模块
export * from './lunar';

// 天文历表模块 (选择性导出避免与 astronomy 冲突)
export {
  // 太阳计算
  calculateEarthLongitude,
  calculateEarthLatitude,
  calculateEarthSunDistance,
  calculateEarthHeliocentricCoord,
  calculateSolarAberration,
  calculateSunTrueLongitude,
  calculateSunGeocentricCoord,
  calculateSunApparentLongitude,
  calculateSunVelocity,
  calculateTimeFromSunLongitude,
  calculateSolarTerms,
  SOLAR_TERM_NAMES_CN,
  SOLAR_TERM_NAMES_EN,
  // 月球计算
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
  // 行星计算
  calculatePlanetHeliocentricCoord,
  calculatePlanetGeocentricCoord,
  calculatePlanetPhaseAngle,
  calculatePlanetMagnitude,
  isPlanetDirect,
  calculateLightTime,
  Planet,
  AU_TO_KM,
  SPEED_OF_LIGHT,
  // 升中天落计算
  RiseTransitSetResult,
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
  // 晨昏光计算
  TwilightType,
  TwilightTimes,
  calculateTwilight,
  calculateCivilTwilight,
  calculateNauticalTwilight,
  calculateAstronomicalTwilight,
} from './ephemeris';

// 日月食模块
export * from './eclipse';

// 简化天文API (用户友好的高级接口)
export {
  ObserverLocation,
  CelestialPosition,
  SunTimes,
  MoonTimes,
  MoonPhaseInfo,
  getSunPosition,
  getMoonPosition,
  getPlanetPosition,
  getSunTimes,
  getMoonTimes,
  getMoonPhase,
  getSolarTerms,
} from './astronomy';

// 数据模块
export {
  // 城市数据
  CityInfo,
  decodeCoordinates,
  encodeCoordinates,
  PROVINCES,
  getCitiesByProvince,
  getProvincialCapital,
  findCityByName,
  getAllCities,
  MAJOR_CITIES,
  // 历史纪年
  EraInfo,
  DynastyInfo,
  DYNASTIES,
  getEraData,
  findEraByYear,
  findEraByName,
  findErasByDynasty,
  yearToEraString,
  getDynastyByYear,
} from './data';
