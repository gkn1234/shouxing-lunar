/**
 * 节日数据 - Festival Data
 *
 * 来源：寿星万年历 lunar.js
 * @see lunar.js:76-128 公历节日数据
 * @see lunar.js:277-340 农历节日数据
 *
 * 包含公历节日、农历节日和周计算节日
 */

/**
 * 节日类型
 */
export enum FestivalType {
  /** 放假节日 */
  Holiday = 'holiday',
  /** 重要节日/纪念日 */
  Important = 'important',
  /** 普通节日 */
  Normal = 'normal',
}

/**
 * 节日信息
 */
export interface FestivalInfo {
  /** 节日名称 */
  name: string;
  /** 节日类型 */
  type: FestivalType;
  /** 起始年份（可选） */
  startYear?: number;
  /** 结束年份（可选） */
  endYear?: number;
}

/**
 * 公历节日表
 * 格式：{ 'MMDD': [...节日信息] }
 */
export const SOLAR_FESTIVALS: Record<string, FestivalInfo[]> = {
  '0101': [{ name: '元旦', type: FestivalType.Holiday }],
  '0214': [{ name: '情人节', type: FestivalType.Important }],
  '0308': [{ name: '妇女节', type: FestivalType.Important }],
  '0312': [{ name: '植树节', type: FestivalType.Important }],
  '0315': [
    { name: '消费者权益日', type: FestivalType.Important, startYear: 1983 },
  ],
  '0401': [{ name: '愚人节', type: FestivalType.Normal, startYear: 1564 }],
  '0404': [{ name: '清明节', type: FestivalType.Holiday }], // 实际需根据节气计算
  '0422': [{ name: '世界地球日', type: FestivalType.Important }],
  '0501': [{ name: '劳动节', type: FestivalType.Holiday, startYear: 1889 }],
  '0504': [{ name: '青年节', type: FestivalType.Important }],
  '0512': [{ name: '国际护士节', type: FestivalType.Important }],
  '0601': [{ name: '儿童节', type: FestivalType.Important, startYear: 1925 }],
  '0701': [
    { name: '香港回归纪念日', type: FestivalType.Important, startYear: 1997 },
    { name: '建党节', type: FestivalType.Important, startYear: 1921 },
  ],
  '0707': [
    { name: '抗日战争纪念日', type: FestivalType.Important, startYear: 1937 },
  ],
  '0801': [{ name: '建军节', type: FestivalType.Important, startYear: 1927 }],
  '0903': [
    { name: '抗日战争胜利纪念日', type: FestivalType.Important, startYear: 1945 },
  ],
  '0910': [{ name: '教师节', type: FestivalType.Important }],
  '0918': [{ name: '九一八事变纪念日', type: FestivalType.Important }],
  '1001': [{ name: '国庆节', type: FestivalType.Holiday, startYear: 1949 }],
  '1002': [{ name: '国庆节', type: FestivalType.Holiday, startYear: 1949 }],
  '1003': [{ name: '国庆节', type: FestivalType.Holiday, startYear: 1949 }],
  '1010': [{ name: '辛亥革命纪念日', type: FestivalType.Important }],
  '1111': [{ name: '光棍节', type: FestivalType.Normal }],
  '1201': [{ name: '世界艾滋病日', type: FestivalType.Important, startYear: 1988 }],
  '1213': [
    { name: '南京大屠杀纪念日', type: FestivalType.Important, startYear: 1937 },
  ],
  '1220': [{ name: '澳门回归纪念日', type: FestivalType.Important }],
  '1224': [{ name: '平安夜', type: FestivalType.Important }],
  '1225': [{ name: '圣诞节', type: FestivalType.Important }],
  '1226': [{ name: '毛泽东诞辰纪念', type: FestivalType.Normal }],
};

/**
 * 农历节日表
 * 格式：{ 'MMDD': [...节日信息] }
 * MM为农历月（01-12），DD为农历日（01-30）
 */
export const LUNAR_FESTIVALS: Record<string, FestivalInfo[]> = {
  '0101': [{ name: '春节', type: FestivalType.Holiday }],
  '0102': [{ name: '大年初二', type: FestivalType.Holiday }],
  '0103': [{ name: '大年初三', type: FestivalType.Holiday }],
  '0115': [{ name: '元宵节', type: FestivalType.Important }],
  '0202': [{ name: '龙抬头', type: FestivalType.Important }],
  '0303': [{ name: '上巳节', type: FestivalType.Normal }],
  '0505': [{ name: '端午节', type: FestivalType.Holiday }],
  '0707': [{ name: '七夕节', type: FestivalType.Important }],
  '0715': [{ name: '中元节', type: FestivalType.Important }],
  '0815': [{ name: '中秋节', type: FestivalType.Holiday }],
  '0909': [{ name: '重阳节', type: FestivalType.Important }],
  '1001': [{ name: '寒衣节', type: FestivalType.Normal }],
  '1015': [{ name: '下元节', type: FestivalType.Normal }],
  '1208': [{ name: '腊八节', type: FestivalType.Important }],
  '1223': [{ name: '小年(北方)', type: FestivalType.Important }],
  '1224': [{ name: '小年(南方)', type: FestivalType.Important }],
  '1230': [{ name: '除夕', type: FestivalType.Holiday }], // 需特殊处理大小月
};

/**
 * 周计算节日表
 * 格式：{ 'MMWWD': [...节日信息] }
 * MM=月份, WW=第几周, D=星期几(0=周日)
 * WW=5表示最后一周
 */
export const WEEK_FESTIVALS: Record<string, FestivalInfo[]> = {
  '01501': [{ name: '世界麻风日', type: FestivalType.Normal }], // 1月最后一个周日
  '05020': [{ name: '母亲节', type: FestivalType.Important }], // 5月第2个周日
  '06030': [{ name: '父亲节', type: FestivalType.Important }], // 6月第3个周日
  '11044': [{ name: '感恩节', type: FestivalType.Important }], // 11月第4个周四
};

/**
 * 获取公历节日
 *
 * @param month - 公历月 (1-12)
 * @param day - 公历日 (1-31)
 * @param year - 年份
 * @returns 节日列表
 */
export function getSolarFestivals(month: number, day: number, year?: number): FestivalInfo[] {
  const key = String(month).padStart(2, '0') + String(day).padStart(2, '0');
  const festivals = SOLAR_FESTIVALS[key] || [];

  if (year === undefined) return festivals;

  return festivals.filter((f) => {
    if (f.startYear && year < f.startYear) return false;
    if (f.endYear && year > f.endYear) return false;
    return true;
  });
}

/**
 * 获取农历节日
 *
 * @param month - 农历月 (1-12)
 * @param day - 农历日 (1-30)
 * @param isLeap - 是否闰月
 * @param monthDays - 本月天数（用于判断除夕）
 * @returns 节日列表
 */
export function getLunarFestivals(
  month: number,
  day: number,
  isLeap: boolean = false,
  monthDays?: number
): FestivalInfo[] {
  // 闰月没有节日
  if (isLeap) return [];

  const key = String(month).padStart(2, '0') + String(day).padStart(2, '0');
  let festivals = LUNAR_FESTIVALS[key] || [];

  // 特殊处理除夕（腊月最后一天）
  if (month === 12 && monthDays !== undefined && day === monthDays) {
    const chuxi = LUNAR_FESTIVALS['1230'];
    if (chuxi) {
      festivals = [...festivals, ...chuxi];
    }
  }

  return festivals;
}

/**
 * 获取周计算节日
 *
 * @param month - 公历月 (1-12)
 * @param weekOfMonth - 本月第几周 (1-5)
 * @param dayOfWeek - 星期几 (0-6, 0=周日)
 * @param isLastWeek - 是否是最后一周
 * @returns 节日列表
 */
export function getWeekFestivals(
  month: number,
  weekOfMonth: number,
  dayOfWeek: number,
  isLastWeek: boolean = false
): FestivalInfo[] {
  const key =
    String(month).padStart(2, '0') +
    String(weekOfMonth).padStart(2, '0') +
    String(dayOfWeek);

  let festivals = WEEK_FESTIVALS[key] || [];

  // 检查最后一周的节日
  if (isLastWeek) {
    const lastWeekKey =
      String(month).padStart(2, '0') + '50' + String(dayOfWeek);
    const lastWeekFestivals = WEEK_FESTIVALS[lastWeekKey] || [];
    festivals = [...festivals, ...lastWeekFestivals];
  }

  return festivals;
}

/**
 * 日期节日汇总
 */
export interface DateFestivals {
  /** 公历节日 */
  solar: FestivalInfo[];
  /** 农历节日 */
  lunar: FestivalInfo[];
  /** 周计算节日 */
  week: FestivalInfo[];
  /** 是否是放假日 */
  isHoliday: boolean;
  /** 所有重要节日名称 */
  importantNames: string[];
  /** 所有节日名称 */
  allNames: string[];
}

/**
 * 获取指定日期的所有节日
 *
 * @param solarMonth - 公历月 (1-12)
 * @param solarDay - 公历日 (1-31)
 * @param solarYear - 公历年
 * @param lunarMonth - 农历月 (1-12)
 * @param lunarDay - 农历日 (1-30)
 * @param isLeapMonth - 是否闰月
 * @param lunarMonthDays - 农历本月天数
 * @param weekOfMonth - 本月第几周
 * @param dayOfWeek - 星期几 (0-6)
 * @param totalWeeks - 本月总周数
 * @returns 节日汇总
 */
export function getAllFestivals(
  solarMonth: number,
  solarDay: number,
  solarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth: boolean,
  lunarMonthDays: number,
  weekOfMonth: number,
  dayOfWeek: number,
  totalWeeks: number
): DateFestivals {
  const solar = getSolarFestivals(solarMonth, solarDay, solarYear);
  const lunar = getLunarFestivals(lunarMonth, lunarDay, isLeapMonth, lunarMonthDays);
  const week = getWeekFestivals(
    solarMonth,
    weekOfMonth,
    dayOfWeek,
    weekOfMonth === totalWeeks
  );

  const all = [...solar, ...lunar, ...week];
  const isHoliday =
    all.some((f) => f.type === FestivalType.Holiday) || dayOfWeek === 0 || dayOfWeek === 6;

  const importantNames = all
    .filter((f) => f.type === FestivalType.Holiday || f.type === FestivalType.Important)
    .map((f) => f.name);

  const allNames = all.map((f) => f.name);

  return {
    solar,
    lunar,
    week,
    isHoliday,
    importantNames,
    allNames,
  };
}
