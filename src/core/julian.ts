/**
 * 儒略日计算 - Julian Day Calculations
 *
 * 来源：寿星万年历 eph0.js (JD 对象)
 * @see eph0.js:276-391 JD对象定义
 * 提供公历与儒略日之间的转换功能
 */

/**
 * 日期时间结构
 * @see eph0.js:284-297 DD函数返回结构
 */
export interface DateTimeRecord {
  /** 年 */
  year: number;
  /** 月 */
  month: number;
  /** 日 */
  day: number;
  /** 时 */
  hour: number;
  /** 分 */
  minute: number;
  /** 秒 (可含小数) */
  second: number;
}

/**
 * 取整数部分 (向下取整)
 * @see eph0.js:41 int2函数
 */
function floor(value: number): number {
  return Math.floor(value);
}

/**
 * 公历日期转儒略日
 * @see eph0.js:277-283 JD.JD函数
 *
 * @param year - 年
 * @param month - 月
 * @param day - 日 (可含小数表示时间)
 * @returns 儒略日数
 *
 * @example
 * ```ts
 * // 2000年1月1日12时
 * gregorianToJD(2000, 1, 1.5) // => 2451545
 * ```
 */
export function gregorianToJD(year: number, month: number, day: number): number {
  let adjustedYear = year;
  let adjustedMonth = month;
  let centuryCorrection = 0;

  // 判断是否为格里高利历日 (1582年10月15日之后)
  // 1582*372 + 10*31 + 15 = 588829
  const isGregorian = year * 372 + month * 31 + floor(day) >= 588829;

  if (adjustedMonth <= 2) {
    adjustedMonth += 12;
    adjustedYear--;
  }

  // 加百年闰修正
  if (isGregorian) {
    const centuryNumber = floor(adjustedYear / 100);
    centuryCorrection = 2 - centuryNumber + floor(centuryNumber / 4);
  }

  return (
    floor(365.25 * (adjustedYear + 4716)) +
    floor(30.6001 * (adjustedMonth + 1)) +
    day +
    centuryCorrection -
    1524.5
  );
}

/**
 * 儒略日转公历日期
 * @see eph0.js:284-297 JD.DD函数
 *
 * @param julianDay - 儒略日数
 * @returns 日期时间记录
 *
 * @example
 * ```ts
 * jdToGregorian(2451545)
 * // => { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 }
 * ```
 */
export function jdToGregorian(julianDay: number): DateTimeRecord {
  let integerPart = floor(julianDay + 0.5);
  let fractionalPart = julianDay + 0.5 - integerPart;

  // 格里高利历修正
  if (integerPart >= 2299161) {
    const centuryCorrection = floor((integerPart - 1867216.25) / 36524.25);
    integerPart += 1 + centuryCorrection - floor(centuryCorrection / 4);
  }

  integerPart += 1524;
  const yearEstimate = floor((integerPart - 122.1) / 365.25);
  integerPart -= floor(365.25 * yearEstimate);
  const monthEstimate = floor(integerPart / 30.601);
  integerPart -= floor(30.601 * monthEstimate);

  let year: number;
  let month: number;
  if (monthEstimate > 13) {
    month = monthEstimate - 13;
    year = yearEstimate - 4715;
  } else {
    month = monthEstimate - 1;
    year = yearEstimate - 4716;
  }
  const day = integerPart;

  // 小数部分转为时分秒
  fractionalPart *= 24;
  const hour = floor(fractionalPart);
  fractionalPart -= hour;
  fractionalPart *= 60;
  const minute = floor(fractionalPart);
  fractionalPart -= minute;
  fractionalPart *= 60;
  const second = fractionalPart;

  return { year, month, day, hour, minute, second };
}

/**
 * 日期时间记录转字符串
 * @see eph0.js:299-308 JD.DD2str函数
 *
 * @param dateTime - 日期时间记录
 * @returns 格式化的日期字符串 "YYYY-MM-DD HH:mm:ss"
 */
export function dateTimeToString(dateTime: DateTimeRecord): string {
  let hour = dateTime.hour;
  let minute = dateTime.minute;
  let second = floor(dateTime.second + 0.5);

  // 处理进位
  if (second >= 60) {
    second -= 60;
    minute++;
  }
  if (minute >= 60) {
    minute -= 60;
    hour++;
  }

  const yearStr = String(dateTime.year).padStart(5, ' ');
  const monthStr = String(dateTime.month).padStart(2, '0');
  const dayStr = String(dateTime.day).padStart(2, '0');
  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  const secondStr = String(second).padStart(2, '0');

  return `${yearStr}-${monthStr}-${dayStr} ${hourStr}:${minuteStr}:${secondStr}`.trimStart();
}

/**
 * 日期时间记录转字符串 (精确到毫秒)
 * @see eph0.js:309-359 JD.DD2strPrecise函数
 *
 * @param dateTime - 日期时间记录
 * @returns 格式化的日期字符串 "YYYY-MM-DD HH:mm:ss.SSS"
 */
export function dateTimeToPreciseString(dateTime: DateTimeRecord): string {
  let hour = dateTime.hour;
  let minute = dateTime.minute;

  // 提取整数秒和毫秒部分
  let second = Math.floor(dateTime.second);
  let millisecond = Math.round((dateTime.second - second) * 1000);

  // 处理进位
  if (millisecond >= 1000) {
    millisecond -= 1000;
    second++;
  }
  if (second >= 60) {
    second -= 60;
    minute++;
  }
  if (minute >= 60) {
    minute -= 60;
    hour++;
  }

  const yearStr = String(dateTime.year).padStart(5, ' ');
  const monthStr = String(dateTime.month).padStart(2, '0');
  const dayStr = String(dateTime.day).padStart(2, '0');
  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  const secondStr = String(second).padStart(2, '0');
  const msStr = String(millisecond).padStart(3, '0');

  return `${yearStr}-${monthStr}-${dayStr} ${hourStr}:${minuteStr}:${secondStr}.${msStr}`.trimStart();
}

/**
 * 儒略日转日期字符串
 * @see eph0.js:360-363 JD.JD2str函数
 *
 * @param julianDay - 儒略日数
 * @returns 格式化的日期字符串
 */
export function jdToString(julianDay: number): string {
  const dateTime = jdToGregorian(julianDay);
  return dateTimeToString(dateTime);
}

/**
 * 从儒略日中提取时间字符串 (去除日期部分)
 * @see eph0.js:370-378 JD.timeStr函数
 *
 * @param julianDay - 儒略日数
 * @returns 时间字符串 "HH:mm:ss"
 */
export function jdToTimeString(julianDay: number): string {
  const adjustedJD = julianDay + 0.5;
  const fractionalDay = adjustedJD - floor(adjustedJD);
  let totalSeconds = floor(fractionalDay * 86400 + 0.5);

  const hour = floor(totalSeconds / 3600);
  totalSeconds -= hour * 3600;
  const minute = floor(totalSeconds / 60);
  totalSeconds -= minute * 60;
  const second = totalSeconds;

  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  const secondStr = String(second).padStart(2, '0');

  return `${hourStr}:${minuteStr}:${secondStr}`;
}

/**
 * 计算星期几
 * @see eph0.js:381 JD.getWeek函数
 *
 * @param julianDay - 儒略日数
 * @returns 星期几 (0=周日, 1=周一, ..., 6=周六)
 */
export function getWeekDay(julianDay: number): number {
  return floor(julianDay + 1.5 + 7000000) % 7;
}

/**
 * 求某年某月的第n个星期w的儒略日数
 * @see eph0.js:382-391 JD.nnweek函数
 *
 * @param year - 年
 * @param month - 月
 * @param nthWeek - 第几个 (1-5)
 * @param weekDay - 星期几 (0-6, 0=周日)
 * @returns 儒略日数
 *
 * @example
 * ```ts
 * // 求2024年11月的第4个星期四 (感恩节)
 * getNthWeekDay(2024, 11, 4, 4)
 * ```
 */
export function getNthWeekDay(
  year: number,
  month: number,
  nthWeek: number,
  weekDay: number
): number {
  const monthStartJD = gregorianToJD(year, month, 1.5);
  const monthStartWeekDay = (floor(monthStartJD) + 1 + 7000000) % 7;

  // monthStartJD - monthStartWeekDay + 7*nthWeek 是第n个星期日
  // 加 weekDay 后为第n个星期 weekDay
  let resultJD = monthStartJD - monthStartWeekDay + 7 * nthWeek + weekDay;

  // 第1个星期 weekDay 可能落在上个月，造成多算1周
  if (weekDay >= monthStartWeekDay) {
    resultJD -= 7;
  }

  // 处理第5个星期的情况
  if (nthWeek === 5) {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    // 如果跑到下个月则减1周
    if (resultJD >= gregorianToJD(nextYear, nextMonth, 1.5)) {
      resultJD -= 7;
    }
  }

  return resultJD;
}

/**
 * JD 工具类 - 保持与原始代码兼容的状态管理
 * @see eph0.js:366-368 JD对象状态属性和方法
 */
export class JD {
  year: number = 2000;
  month: number = 1;
  day: number = 1;
  hour: number = 12;
  minute: number = 0;
  second: number = 0;

  /**
   * 将当前状态转换为儒略日
   * @see eph0.js:367 JD.toJD方法
   */
  toJD(): number {
    const dayFraction = ((this.second / 60 + this.minute) / 60 + this.hour) / 24;
    return gregorianToJD(this.year, this.month, this.day + dayFraction);
  }

  /**
   * 从儒略日设置当前状态
   * @see eph0.js:368 JD.setFromJD方法
   */
  setFromJD(julianDay: number): void {
    const dateTime = jdToGregorian(julianDay);
    this.year = dateTime.year;
    this.month = dateTime.month;
    this.day = dateTime.day;
    this.hour = dateTime.hour;
    this.minute = dateTime.minute;
    this.second = dateTime.second;
  }
}
