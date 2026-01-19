/**
 * 农历年历计算 - Lunar Calendar
 *
 * 来源：寿星万年历 lunar.js
 * @see lunar.js:599-676 SSQ.calcY函数
 *
 * 根据实朔实气计算农历年历，包括：
 * - 计算一年中的节气和朔日
 * - 确定闰月位置（无中气置闰法）
 * - 处理历史特殊时期的月建问题
 */

import { J2000 } from '../core/constants';
import { LRUCache } from '../core/cache';
import { calculateShuoQi, LUNAR_MONTH_NAMES } from './solar-term';

// 年历缓存（容量100年）
const yearDataCache = new LRUCache<number, LunarYearData>(100);

/**
 * 农历年历数据
 */
export interface LunarYearData {
  /** 中气表，25个节气儒略日 (J2000起算) */
  zhongQi: number[];
  /** 合朔表，15个朔日儒略日 (J2000起算) */
  heSuo: number[];
  /** 各月大小（天数） */
  monthDays: number[];
  /** 各月名称 */
  monthNames: string[];
  /** 闰月位置，0表示无闰月 */
  leapMonth: number;
  /** 年份 (公历) */
  year: number;
}

/**
 * 计算农历年历（带缓存）
 * @see lunar.js:609-676 SSQ.calcY函数
 *
 * 农历排月序计算，有效范围：两个冬至之间
 *
 * @param jd - 参考儒略日 (J2000起算)，应在目标年份范围内
 * @returns 农历年历数据
 */
export function calculateLunarYear(jd: number): LunarYearData {
  // 估算年份作为缓存键
  const year = Math.floor((jd + 10 + 180) / 365.2422) + 2000;

  // 尝试从缓存获取
  const cached = yearDataCache.get(year);
  if (cached && jd >= cached.zhongQi[0] && jd < cached.zhongQi[24]) {
    return cached;
  }

  // 缓存未命中，进行计算
  const result = calculateLunarYearInternal(jd);

  // 存入缓存
  yearDataCache.set(result.year, result);

  return result;
}

/**
 * 实际计算函数（无缓存）
 * @see lunar.js:609-676 SSQ.calcY函数
 *
 * @param jd - 参考儒略日 (J2000起算)
 * @returns 农历年历数据
 */
function calculateLunarYearInternal(jd: number): LunarYearData {
  const zhongQi: number[] = [];
  const heSuo: number[] = [];
  const monthDays: number[] = [];
  const monthNames: string[] = [];

  // 估算冬至时刻
  // 355是2000.12冬至的J2000儒略日
  let winterSolsticeJd = Math.floor((jd - 355 + 183) / 365.2422) * 365.2422 + 355;
  if (calculateShuoQi(winterSolsticeJd, 'qi') > jd) {
    winterSolsticeJd -= 365.2422;
  }

  // 计算25个节气（从冬至开始到下一个冬至之后）
  for (let i = 0; i < 25; i++) {
    zhongQi[i] = calculateShuoQi(winterSolsticeJd + 15.2184 * i, 'qi');
  }

  // 补算前两个节气，确保一年中所有月份的气全部被计算在内
  // 这些值目前未使用，但保留作为参考
  // const pe1 = calculateShuoQi(winterSolsticeJd - 15.2, 'qi');
  // const pe2 = calculateShuoQi(winterSolsticeJd - 30.4, 'qi');

  // 求较靠近冬至的朔日
  let newMoonNearWinter = calculateShuoQi(zhongQi[0], 'shuo');
  if (newMoonNearWinter > zhongQi[0]) {
    newMoonNearWinter -= 29.53;
  }

  // 计算15个朔日
  for (let i = 0; i < 15; i++) {
    heSuo[i] = calculateShuoQi(newMoonNearWinter + 29.5306 * i, 'shuo');
  }

  // 计算月大小和初始月序
  let leapMonth = 0;
  for (let i = 0; i < 14; i++) {
    monthDays[i] = heSuo[i + 1] - heSuo[i];
    monthNames[i] = String(i); // 初始化月序
  }

  // 确定年份
  const year = Math.floor((zhongQi[0] + 10 + 180) / 365.2422) + 2000;

  // -721年至-104年的特殊处理（后九月及月建问题）
  if (year >= -721 && year <= -104) {
    const result = handleAncientCalendar(year, heSuo, monthNames);
    return {
      zhongQi,
      heSuo,
      monthDays,
      monthNames: result.monthNames,
      leapMonth: 0,
      year,
    };
  }

  // 无中气置闰法确定闰月
  if (heSuo[13] <= zhongQi[24]) {
    // 第13月的月末没有超过冬至，说明今年含有13个月
    let i = 1;
    for (; heSuo[i + 1] > zhongQi[2 * i] && i < 13; i++);
    leapMonth = i;
    for (; i < 14; i++) {
      monthNames[i] = String(Number(monthNames[i]) - 1);
    }
  }

  // 转换月名称（月建别名）
  for (let i = 0; i < 14; i++) {
    const firstDayAbsoluteJd = heSuo[i] + J2000; // 初一的绝对儒略日
    const monthBuildIndex = Number(monthNames[i]); // 月建序号
    let monthChar = LUNAR_MONTH_NAMES[monthBuildIndex % 12]; // 默认月名称

    // 历史特殊时期的月名称修正
    if (firstDayAbsoluteJd >= 1724360 && firstDayAbsoluteJd <= 1729794) {
      // 8.01.15至23.12.02 建子为十二
      monthChar = LUNAR_MONTH_NAMES[(monthBuildIndex + 1) % 12];
    } else if (firstDayAbsoluteJd >= 1807724 && firstDayAbsoluteJd <= 1808699) {
      // 237.04.12至239.12.13 建子为十二
      monthChar = LUNAR_MONTH_NAMES[(monthBuildIndex + 1) % 12];
    } else if (firstDayAbsoluteJd >= 1999349 && firstDayAbsoluteJd <= 1999467) {
      // 761.12.02至762.03.30 建子为正月
      monthChar = LUNAR_MONTH_NAMES[(monthBuildIndex + 2) % 12];
    } else if (firstDayAbsoluteJd >= 1973067 && firstDayAbsoluteJd <= 1977052) {
      // 689.12.18至700.11.15 特殊处理
      if (monthBuildIndex % 12 === 0) monthChar = '正';
      if (monthBuildIndex === 2) monthChar = '一';
    }

    // 特殊日期修正
    if (firstDayAbsoluteJd === 1729794 || firstDayAbsoluteJd === 1808699) {
      monthChar = '拾贰'; // 避免两个连续十二月
    }

    monthNames[i] = monthChar;
  }

  return {
    zhongQi,
    heSuo,
    monthDays,
    monthNames,
    leapMonth,
    year,
  };
}

/**
 * 处理古代历法（-721年至-104年）
 * @see lunar.js:634-652
 *
 * @param year - 年份
 * @param heSuo - 合朔表
 * @param monthNames - 月名称数组
 * @returns 处理后的月名称
 */
function handleAncientCalendar(
  year: number,
  heSuo: number[],
  monthNames: string[]
): { monthNames: string[] } {
  const newYearNewMoons: number[] = []; // 各历法时代的正月朔日
  const leapNames: string[] = [];
  const monthBase: number[] = [];

  for (let i = 0; i < 3; i++) {
    const checkYear = year + i - 1;

    // 根据年份确定使用的历法
    if (checkYear >= -721) {
      // 春秋历
      newYearNewMoons[i] = calculateShuoQi(1457698 - J2000 + Math.floor(0.342 + (checkYear + 721) * 12.368422) * 29.5306, 'shuo');
      leapNames[i] = '十三';
      monthBase[i] = 2;
    }
    if (checkYear >= -479) {
      // 战国历
      newYearNewMoons[i] = calculateShuoQi(1546083 - J2000 + Math.floor(0.5 + (checkYear + 479) * 12.368422) * 29.5306, 'shuo');
      leapNames[i] = '十三';
      monthBase[i] = 2;
    }
    if (checkYear >= -220) {
      // 秦汉历
      newYearNewMoons[i] = calculateShuoQi(1640641 - J2000 + Math.floor(0.866 + (checkYear + 220) * 12.369) * 29.5306, 'shuo');
      leapNames[i] = '后九';
      monthBase[i] = 11;
    }
  }

  const result: string[] = [...monthNames];

  for (let i = 0; i < 14; i++) {
    let calendarEraIndex = 2; // 从最新历法向前查找
    for (; calendarEraIndex >= 0; calendarEraIndex--) {
      if (heSuo[i] >= newYearNewMoons[calendarEraIndex]) break;
    }
    if (calendarEraIndex < 0) calendarEraIndex = 0;

    const monthAccumulation = Math.floor((heSuo[i] - newYearNewMoons[calendarEraIndex] + 15) / 29.5306); // 该月积数
    if (monthAccumulation < 12) {
      result[i] = LUNAR_MONTH_NAMES[(monthAccumulation + monthBase[calendarEraIndex]) % 12];
    } else {
      result[i] = leapNames[calendarEraIndex];
    }
  }

  return { monthNames: result };
}

/**
 * 农历日期信息
 */
export interface LunarDateInfo {
  /** 农历年 */
  year: number;
  /** 农历月（1-12） */
  month: number;
  /** 农历日（1-30） */
  day: number;
  /** 是否闰月 */
  isLeap: boolean;
  /** 月名称 */
  monthName: string;
  /** 日名称 */
  dayName: string;
  /** 该月天数 */
  monthDays: number;
}

// 缓存当前年历数据（保留用于 getLunarDateInfo 的局部优化）
let cachedYearData: LunarYearData | null = null;

/**
 * 获取指定日期的农历信息
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 农历日期信息
 */
export function getLunarDateInfo(jd: number): LunarDateInfo {
  // 检查缓存是否有效
  if (
    !cachedYearData ||
    jd < cachedYearData.zhongQi[0] ||
    jd >= cachedYearData.zhongQi[24]
  ) {
    cachedYearData = calculateLunarYear(jd);
  }

  const yearData = cachedYearData;

  // 找到所在农历月
  let monthIndex = Math.floor((jd - yearData.heSuo[0]) / 30);
  if (monthIndex < 13 && yearData.heSuo[monthIndex + 1] <= jd) {
    monthIndex++;
  }
  if (monthIndex < 0) monthIndex = 0;
  if (monthIndex > 13) monthIndex = 13;

  const daysFromMonthStart = jd - yearData.heSuo[monthIndex]; // 距农历月首的天数
  const isLeap = yearData.leapMonth > 0 && yearData.leapMonth === monthIndex;

  // 计算实际农历月份
  let lunarMonth = monthIndex;
  if (yearData.leapMonth > 0 && monthIndex >= yearData.leapMonth) {
    lunarMonth = monthIndex - 1;
  }

  // 月份映射到1-12
  const monthMap: Record<string, number> = {
    '正': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
    '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12,
    '一': 1, '拾贰': 12, '后九': 9, '十三': 13,
  };

  const monthName = yearData.monthNames[monthIndex];
  const month = monthMap[monthName] || ((lunarMonth % 12) + 1);

  // 农历日名称
  const dayNames = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
  ];

  return {
    year: yearData.year,
    month,
    day: Math.floor(daysFromMonthStart) + 1,
    isLeap,
    monthName: (isLeap ? '闰' : '') + monthName,
    dayName: dayNames[Math.floor(daysFromMonthStart)] || '初一',
    monthDays: yearData.monthDays[monthIndex],
  };
}

/**
 * 获取年历缓存统计信息
 *
 * @returns 缓存统计信息对象
 */
export function getLunarYearCacheStats(): {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  hitRate: number;
} {
  return yearDataCache.getStats();
}

/**
 * 清除年历缓存
 */
export function clearLunarYearCache(): void {
  yearDataCache.clear();
  cachedYearData = null;
}
