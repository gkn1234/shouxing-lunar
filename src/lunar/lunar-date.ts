/**
 * LunarDate 核心类 - Lunar Date Class
 *
 * 来源：寿星万年历 lunar.js
 * @see lunar.js:724-895 Lunar类
 *
 * 提供类似 dayjs/moment 风格的农历日期 API
 */

import { J2000 } from '../core/constants';
import {
  gregorianToJD,
  jdToGregorian,
} from '../core/julian';
import { getLunarDateInfo, LunarDateInfo, calculateLunarYear } from './calendar';
import { SOLAR_TERM_NAMES } from './solar-term';
import {
  getYearGanZhi,
  getYearGanZhiBySpring,
  getMonthGanZhi,
  getDayGanZhi,
  getHourGanZhi,
  getShengXiao,
  getXingZuo,
} from './gan-zhi';
import { getAllFestivals, DateFestivals } from './festival';

/**
 * 内部日期记录
 */
interface InternalDateRecord {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * LunarDate 类 - 农历日期
 *
 * @example
 * ```ts
 * // 从公历创建
 * const d1 = new LunarDate(2024, 2, 10);
 * const d2 = new LunarDate(new Date());
 * const d3 = new LunarDate('2024-02-10');
 *
 * // 从农历创建
 * const d4 = LunarDate.fromLunar(2024, 1, 1);
 * const d5 = LunarDate.fromLunar(2024, 6, 15, true); // 闰月
 *
 * // 获取信息
 * d1.lunarYear();   // 农历年
 * d1.lunarMonth();  // 农历月
 * d1.lunarDay();    // 农历日
 * d1.ganZhiYear();  // 干支年: '甲辰'
 * ```
 */
export class LunarDate {
  private _jd: number; // 儒略日 (J2000起算)
  private _solar: InternalDateRecord; // 公历日期
  private _lunar: LunarDateInfo | null = null; // 农历日期缓存

  /**
   * 创建 LunarDate 实例
   *
   * @param yearOrDate - 年份、Date对象或日期字符串
   * @param month - 月份 (1-12)
   * @param day - 日期 (1-31)
   */
  constructor(yearOrDate?: number | Date | string, month?: number, day?: number) {
    if (yearOrDate === undefined) {
      // 当前时间
      const now = new Date();
      this._solar = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
      };
    } else if (yearOrDate instanceof Date) {
      this._solar = {
        year: yearOrDate.getFullYear(),
        month: yearOrDate.getMonth() + 1,
        day: yearOrDate.getDate(),
        hour: yearOrDate.getHours(),
        minute: yearOrDate.getMinutes(),
        second: yearOrDate.getSeconds(),
      };
    } else if (typeof yearOrDate === 'string') {
      const date = new Date(yearOrDate);
      this._solar = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: 12,
        minute: 0,
        second: 0,
      };
    } else {
      this._solar = {
        year: yearOrDate,
        month: month || 1,
        day: day || 1,
        hour: 12,
        minute: 0,
        second: 0,
      };
    }

    this._jd = gregorianToJD(this._solar.year, this._solar.month, this._solar.day) - J2000;
  }

  /**
   * 从农历日期创建
   *
   * @param lunarYear - 农历年
   * @param lunarMonth - 农历月 (1-12)
   * @param lunarDay - 农历日 (1-30)
   * @param isLeap - 是否闰月
   * @returns LunarDate 实例
   */
  static fromLunar(
    lunarYear: number,
    lunarMonth: number,
    lunarDay: number,
    isLeap: boolean = false
  ): LunarDate {
    // 估算公历日期
    const estimatedJd =
      (lunarYear - 2000) * 365.2422 + (lunarMonth - 1) * 29.5306 + lunarDay - 30;

    // 获取年历数据
    const yearData = calculateLunarYear(estimatedJd);

    // 找到对应的农历月
    let monthIndex = -1;
    for (let i = 0; i < 14; i++) {
      const monthName = yearData.monthNames[i];
      const isLeapMonth = yearData.leapMonth > 0 && yearData.leapMonth === i;

      // 匹配月份
      const monthMap: Record<string, number> = {
        '正': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
        '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12,
      };
      const m = monthMap[monthName] || 0;

      if (m === lunarMonth && isLeapMonth === isLeap) {
        monthIndex = i;
        break;
      }
    }

    if (monthIndex === -1) {
      // 尝试非闰月
      for (let i = 0; i < 14; i++) {
        const monthName = yearData.monthNames[i];
        const monthMap: Record<string, number> = {
          '正': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
          '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12,
        };
        const m = monthMap[monthName] || 0;
        if (m === lunarMonth) {
          monthIndex = i;
          break;
        }
      }
    }

    if (monthIndex === -1) monthIndex = 0;

    // 计算儒略日
    const jd = yearData.heSuo[monthIndex] + lunarDay - 1;

    // 转换为公历
    const solar = jdToGregorian(jd + J2000);
    return new LunarDate(solar.year, solar.month, solar.day);
  }

  /**
   * 从儒略日创建
   */
  static fromJD(jd: number): LunarDate {
    const solar = jdToGregorian(jd + J2000);
    return new LunarDate(solar.year, solar.month, solar.day);
  }

  // ============ 公历信息 ============

  /** 公历年 */
  year(): number {
    return this._solar.year;
  }

  /** 公历月 (1-12) */
  month(): number {
    return this._solar.month;
  }

  /** 公历日 */
  date(): number {
    return this._solar.day;
  }

  /** 星期 (0-6, 0=周日) */
  day(): number {
    return ((Math.floor(this._jd) + J2000 + 1 + 7000000) % 7);
  }

  /** 小时 */
  hour(): number {
    return this._solar.hour || 0;
  }

  /** 分钟 */
  minute(): number {
    return this._solar.minute || 0;
  }

  /** 秒 */
  second(): number {
    return Math.floor(this._solar.second || 0);
  }

  // ============ 农历信息 ============

  /** 获取农历信息（懒加载） */
  private getLunar(): LunarDateInfo {
    if (!this._lunar) {
      this._lunar = getLunarDateInfo(this._jd);
    }
    return this._lunar;
  }

  /** 农历年 */
  lunarYear(): number {
    return this.getLunar().year;
  }

  /** 农历月 (1-12) */
  lunarMonth(): number {
    return this.getLunar().month;
  }

  /** 农历日 (1-30) */
  lunarDay(): number {
    return this.getLunar().day;
  }

  /** 是否闰月 */
  isLeapMonth(): boolean {
    return this.getLunar().isLeap;
  }

  /** 农历月名称 */
  lunarMonthName(): string {
    return this.getLunar().monthName;
  }

  /** 农历日名称 */
  lunarDayName(): string {
    return this.getLunar().dayName;
  }

  /** 农历本月天数 */
  lunarMonthDays(): number {
    return this.getLunar().monthDays;
  }

  // ============ 干支信息 ============

  /** 干支纪年（立春为界） */
  ganZhiYear(): string {
    return getYearGanZhi(this._jd).ganZhi;
  }

  /** 干支纪年（正月初一为界） */
  ganZhiYearBySpring(): string {
    return getYearGanZhiBySpring(this._jd).ganZhi;
  }

  /** 干支纪月 */
  ganZhiMonth(): string {
    return getMonthGanZhi(this._jd).ganZhi;
  }

  /** 干支纪日 */
  ganZhiDay(): string {
    return getDayGanZhi(this._jd).ganZhi;
  }

  /** 干支纪时 */
  ganZhiHour(): string {
    return getHourGanZhi(this._jd).ganZhi;
  }

  /** 生肖 */
  zodiac(): string {
    return getShengXiao(this._jd);
  }

  /** 星座 */
  constellation(): string {
    return getXingZuo(this._jd);
  }

  // ============ 节气与节日 ============

  /** 当日节气（如果有） */
  solarTerm(): string | null {
    const yearData = calculateLunarYear(this._jd);
    for (let i = 0; i < 24; i++) {
      if (Math.floor(yearData.zhongQi[i]) === Math.floor(this._jd)) {
        return SOLAR_TERM_NAMES[i];
      }
    }
    return null;
  }

  /** 获取节日信息 */
  festivals(): DateFestivals {
    const lunar = this.getLunar();
    const weekDay = this.day();
    const monthDay1Week = ((Math.floor(this._jd) - this.date() + 1 + J2000 + 1 + 7000000) % 7);
    const weekOfMonth = Math.floor((monthDay1Week + this.date() - 1) / 7) + 1;
    const totalWeeks = Math.floor((monthDay1Week + this.daysInMonth() - 1) / 7) + 1;

    return getAllFestivals(
      this.month(),
      this.date(),
      this.year(),
      lunar.month,
      lunar.day,
      lunar.isLeap,
      lunar.monthDays,
      weekOfMonth,
      weekDay,
      totalWeeks
    );
  }

  /** 公历节日 */
  festival(): string[] {
    return this.festivals().solar.map((f) => f.name);
  }

  /** 农历节日 */
  lunarFestival(): string[] {
    return this.festivals().lunar.map((f) => f.name);
  }

  // ============ 日期操作 ============

  /** 本月天数 */
  daysInMonth(): number {
    const y = this.year();
    const m = this.month();
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (m === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) {
      return 29;
    }
    return days[m - 1];
  }

  /** 克隆 */
  clone(): LunarDate {
    return new LunarDate(this.year(), this.month(), this.date());
  }

  /** 添加天数 */
  add(value: number, unit: 'day' | 'month' | 'year' = 'day'): LunarDate {
    const result = this.clone();
    if (unit === 'day') {
      return LunarDate.fromJD(this._jd + value);
    } else if (unit === 'month') {
      let y = result._solar.year;
      let m = result._solar.month + value;
      while (m > 12) {
        m -= 12;
        y++;
      }
      while (m < 1) {
        m += 12;
        y--;
      }
      const d = Math.min(result._solar.day, new LunarDate(y, m, 1).daysInMonth());
      return new LunarDate(y, m, d);
    } else if (unit === 'year') {
      return new LunarDate(result._solar.year + value, result._solar.month, result._solar.day);
    }
    return result;
  }

  /** 减去天数 */
  subtract(value: number, unit: 'day' | 'month' | 'year' = 'day'): LunarDate {
    return this.add(-value, unit);
  }

  // ============ 比较 ============

  /** 是否在另一日期之前 */
  isBefore(other: LunarDate): boolean {
    return this._jd < other._jd;
  }

  /** 是否在另一日期之后 */
  isAfter(other: LunarDate): boolean {
    return this._jd > other._jd;
  }

  /** 是否同一天 */
  isSame(other: LunarDate, unit: 'day' | 'month' | 'year' = 'day'): boolean {
    if (unit === 'day') {
      return Math.floor(this._jd) === Math.floor(other._jd);
    } else if (unit === 'month') {
      return this.year() === other.year() && this.month() === other.month();
    } else if (unit === 'year') {
      return this.year() === other.year();
    }
    return false;
  }

  /** 计算两日期差 */
  diff(other: LunarDate, unit: 'day' | 'month' | 'year' = 'day'): number {
    if (unit === 'day') {
      return Math.floor(this._jd) - Math.floor(other._jd);
    } else if (unit === 'month') {
      return (this.year() - other.year()) * 12 + (this.month() - other.month());
    } else if (unit === 'year') {
      return this.year() - other.year();
    }
    return 0;
  }

  // ============ 格式化与转换 ============

  /** 转为 Date 对象 */
  toDate(): Date {
    return new Date(this.year(), this.month() - 1, this.date());
  }

  /** 获取儒略日 */
  toJulian(): number {
    return this._jd + J2000;
  }

  /** 获取时间戳 */
  valueOf(): number {
    return this.toDate().valueOf();
  }

  /** 格式化输出 */
  format(template: string = 'YYYY-MM-DD'): string {
    const lunar = this.getLunar();
    const pad = (n: number) => String(n).padStart(2, '0');

    return template
      .replace(/YYYY/g, String(this.year()))
      .replace(/MM/g, pad(this.month()))
      .replace(/DD/g, pad(this.date()))
      .replace(/lYYYY/g, String(lunar.year))
      .replace(/lMM/g, lunar.monthName)
      .replace(/lDD/g, lunar.dayName)
      .replace(/GY/g, this.ganZhiYear())
      .replace(/GM/g, this.ganZhiMonth())
      .replace(/GD/g, this.ganZhiDay())
      .replace(/GH/g, this.ganZhiHour())
      .replace(/SX/g, this.zodiac());
  }

  /** 转为字符串 */
  toString(): string {
    return this.format('YYYY-MM-DD');
  }

  /** 转为农历字符串 */
  toLunarString(): string {
    const lunar = this.getLunar();
    return `${lunar.year}年${lunar.monthName}月${lunar.dayName}`;
  }
}

/**
 * 创建 LunarDate 实例的工厂函数
 *
 * @example
 * ```ts
 * const d1 = lunar();           // 当前日期
 * const d2 = lunar('2024-02-10');
 * const d3 = lunar(2024, 2, 10);
 * ```
 */
export function lunar(
  yearOrDate?: number | Date | string,
  month?: number,
  day?: number
): LunarDate {
  return new LunarDate(yearOrDate, month, day);
}

// 添加 fromLunar 静态方法到工厂函数
lunar.fromLunar = LunarDate.fromLunar;
lunar.fromJD = LunarDate.fromJD;
