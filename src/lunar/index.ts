/**
 * Lunar module - 农历模块
 *
 * 包含农历日期类、节气计算、干支计算等功能
 */

// 核心类
export { LunarDate, lunar } from './lunar-date';

// 日历计算 - 类型导出
export type { LunarYearData, LunarDateInfo } from './calendar';

// 日历计算
export {
  calculateLunarYear,
  getLunarDateInfo,
  clearLunarYearCache,
} from './calendar';

// 实朔实气计算
export {
  SHUO_KB,
  QI_KB,
  calculateShuoLow,
  calculateQiLow,
  calculateQiHigh,
  calculateShuoHigh,
  calculateShuoQi,
  SOLAR_TERM_NAMES,
  LUNAR_MONTH_NAMES,
  LUNAR_DAY_NAMES,
  MOON_PHASE_NAMES,
} from './solar-term';

// 干支计算 - 类型导出
export type { GanZhiInfo, FullGanZhiInfo } from './gan-zhi';

// 干支计算
export {
  TIAN_GAN,
  DI_ZHI,
  SHENG_XIAO,
  XING_ZUO,
  getGanZhi,
  getYearGanZhi,
  getYearGanZhiBySpring,
  getMonthGanZhi,
  getDayGanZhi,
  getHourGanZhi,
  getShengXiao,
  getXingZuo,
  getFullGanZhi,
  ganZhiToIndex,
  JIA_ZI_TABLE,
} from './gan-zhi';

// 节日数据 - 类型导出
export type { FestivalInfo, DateFestivals } from './festival';

// 节日数据
export {
  FestivalType,
  SOLAR_FESTIVALS,
  LUNAR_FESTIVALS,
  WEEK_FESTIVALS,
  getSolarFestivals,
  getLunarFestivals,
  getWeekFestivals,
  getAllFestivals,
} from './festival';
