/**
 * 天文常数 - Astronomical Constants
 *
 * 来源：寿星万年历 eph0.js
 * 这些常数用于天文计算的基础
 */

// ==================== 角度转换常数 ====================
// @see eph0.js:26-29

/** 每弧度的角秒数 @see eph0.js:26 */
export const RAD = (180 * 3600) / Math.PI;

/** 每弧度的度数 @see eph0.js:27 */
export const RADD = 180 / Math.PI;

/** 2π @see eph0.js:28 */
export const PI2 = Math.PI * 2;

/** π/2 @see eph0.js:29 */
export const PI_2 = Math.PI / 2;

// ==================== 时间基准 ====================

/** J2000 纪元的儒略日数 (2000年1月1日12时TT) @see eph0.js:30 */
export const J2000 = 2451545;

// ==================== 地球相关常数 ====================
// @see eph0.js:15-23

/** 地球赤道半径 (千米) @see eph0.js:15 */
export const CS_R_EARTH = 6378.1366;

/** 地球平均半径 (千米) @see eph0.js:16 */
export const CS_R_EARTH_AVG = 0.99834 * CS_R_EARTH;

/** 地球极赤半径比 @see eph0.js:17 */
export const CS_BA = 0.99664719;

/** 地球极赤半径比的平方 @see eph0.js:18 */
export const CS_BA2 = CS_BA * CS_BA;

// ==================== 天文单位相关 ====================
// @see eph0.js:19-23

/** 天文单位长度 (千米) @see eph0.js:19 */
export const CS_AU = 1.49597870691e8;

/** sin(太阳视差) @see eph0.js:20 */
export const CS_SIN_P = CS_R_EARTH / CS_AU;

/** 太阳视差 (弧度) @see eph0.js:21 */
export const CS_PI = Math.asin(CS_SIN_P);

/** 光速 (千米/秒) @see eph0.js:22 */
export const CS_GS = 299792.458;

/** 每天文单位的光行时间 (儒略世纪) @see eph0.js:23 */
export const CS_AGX = CS_AU / CS_GS / 86400 / 36525;

// ==================== 月亮相关常数 ====================
// @see eph0.js:32-37

/** 月亮与地球的半径比 (用于半影计算) @see eph0.js:32 */
export const CS_K = 0.2725076;

/** 月亮与地球的半径比 (用于本影计算) @see eph0.js:33 */
export const CS_K2 = 0.2722810;

/** 太阳与地球的半径比 (对应959.64角秒) @see eph0.js:34 */
export const CS_K0 = 109.1222;

/** 用于月亮视半径计算 @see eph0.js:35 */
export const CS_S_MOON = CS_K * CS_R_EARTH * 1.0000036 * RAD;

/** 用于月亮视半径计算 (本影) @see eph0.js:36 */
export const CS_S_MOON2 = CS_K2 * CS_R_EARTH * 1.0000036 * RAD;

/** 用于太阳视半径计算 (角秒) @see eph0.js:37 */
export const CS_S_SUN = 959.64;

// ==================== 行星数据 ====================
// @see eph0.js:24-25

/** 行星会合周期 (天) @see eph0.js:24 */
export const PLANET_SYNODIC_PERIODS = [116, 584, 780, 399, 378, 370, 367, 367] as const;

/** 行星名称 (中文) @see eph0.js:25 */
export const PLANET_NAMES_CN = [
  '地球',
  '水星',
  '金星',
  '火星',
  '木星',
  '土星',
  '天王星',
  '海王星',
  '冥王星',
] as const;

/** 行星名称 (英文) */
export const PLANET_NAMES_EN = [
  'Earth',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const;

// ==================== 星期名称 ====================
// @see eph0.js:380

/** 星期名称 (中文) @see eph0.js:380 */
export const WEEK_NAMES_CN = ['日', '一', '二', '三', '四', '五', '六'] as const;

/** 星期名称 (英文) */
export const WEEK_NAMES_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
