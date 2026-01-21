/**
 * Eclipse module - 日月食模块
 *
 * 来源：寿星万年历 eph.js
 * @see eph.js:342-1291 日月食计算相关代码
 *
 * 包含日食和月食的计算功能
 */

// 月食计算 - 类型导出
export type {
  LunarEclipseType,
  LunarEclipseTimes,
  LunarEclipseInfo,
} from './lunar-eclipse';

// 月食计算
export {
  calculateLunarEclipse,
  findLunarEclipses,
  findNextLunarEclipse,
  convertToAbsoluteJd,
  getLunarEclipseTypeName,
} from './lunar-eclipse';

// 日食计算 - 类型导出
export type {
  SolarEclipseType,
  SolarEclipseQuickResult,
  SolarEclipseInfo,
} from './solar-eclipse';

// 日食计算
export {
  searchSolarEclipseFast,
  calculateSolarEclipse,
  findSolarEclipses,
  findNextSolarEclipse,
  getSolarEclipseTypeName,
  isCentralEclipse,
  isTotalEclipse,
  isAnnularEclipse,
} from './solar-eclipse';

