/**
 * 干支计算 - Gan-Zhi (Heavenly Stems and Earthly Branches)
 *
 * 来源：寿星万年历 lunar.js
 * @see lunar.js:210-218 天干地支生肖数据
 * @see lunar.js:802-830 干支纪年纪月纪日计算
 *
 * 中国传统干支纪年法，用于农历计时
 */

import { calculateLunarYear } from './calendar';

/**
 * 十天干
 */
export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

/**
 * 十二地支
 */
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/**
 * 十二生肖
 */
export const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;

/**
 * 十二星座
 */
export const XING_ZUO = [
  '摩羯',
  '水瓶',
  '双鱼',
  '白羊',
  '金牛',
  '双子',
  '巨蟹',
  '狮子',
  '处女',
  '天秤',
  '天蝎',
  '射手',
] as const;

/**
 * 干支信息
 */
export interface GanZhiInfo {
  /** 天干 */
  gan: string;
  /** 地支 */
  zhi: string;
  /** 干支组合 */
  ganZhi: string;
  /** 天干索引 (0-9) */
  ganIndex: number;
  /** 地支索引 (0-11) */
  zhiIndex: number;
}

/**
 * 根据索引获取干支
 *
 * @param index - 干支索引 (0-59)
 * @returns 干支信息
 */
export function getGanZhi(index: number): GanZhiInfo {
  const n = ((index % 60) + 60) % 60; // 确保正数
  const ganIndex = n % 10;
  const zhiIndex = n % 12;

  return {
    gan: TIAN_GAN[ganIndex],
    zhi: DI_ZHI[zhiIndex],
    ganZhi: TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex],
    ganIndex,
    zhiIndex,
  };
}

/**
 * 干支纪年（以立春为界）
 * @see lunar.js:802-816
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 干支信息
 */
export function getYearGanZhi(jd: number): GanZhiInfo {
  const yearData = calculateLunarYear(jd);
  const lichun = yearData.zhongQi[3]; // 立春

  // 以立春为界定纪年
  const adjustedDays = lichun + (jd < lichun ? -365 : 0) + 365.25 * 16 - 35;
  const yearIndex = Math.floor(adjustedDays / 365.2422 + 0.5);

  // 1984年为甲子年
  const index = yearIndex + 12000;
  return getGanZhi(index);
}

/**
 * 干支纪年（以正月初一为界）
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 干支信息
 */
export function getYearGanZhiBySpring(jd: number): GanZhiInfo {
  const yearData = calculateLunarYear(jd);

  // 找春节（正月初一）
  let springFestivalJd = yearData.heSuo[2]; // 一般第3个月为春节
  for (let j = 0; j < 14; j++) {
    if (yearData.monthNames[j] !== '正' || (yearData.leapMonth === j && j > 0)) continue;
    springFestivalJd = yearData.heSuo[j];
    if (jd < springFestivalJd) {
      springFestivalJd -= 365;
      break;
    }
  }

  // 计算该年春节与1984年平均春节相差天数
  springFestivalJd = springFestivalJd + 5810;
  const yearIndex = Math.floor(springFestivalJd / 365.2422 + 0.5);

  const index = yearIndex + 12000;
  return getGanZhi(index);
}

/**
 * 干支纪月
 * @see lunar.js:821-826
 *
 * 以节气（大雪开始）为界
 * 1998年12月7日（大雪）为起算点
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 干支信息
 */
export function getMonthGanZhi(jd: number): GanZhiInfo {
  const yearData = calculateLunarYear(jd);

  // 相对大雪的月数计算
  let monthIndex = Math.floor((jd - yearData.zhongQi[0]) / 30.43685);
  if (monthIndex < 12 && jd >= yearData.zhongQi[2 * monthIndex + 1]) {
    monthIndex++;
  }

  // 相对于1998年12月7日（大雪）的月数
  // 900000为正数基数
  const monthOffset = monthIndex + Math.floor((yearData.zhongQi[12] + 390) / 365.2422) * 12 + 900000;

  return getGanZhi(monthOffset);
}

/**
 * 干支纪日
 * @see lunar.js:828-830
 *
 * 以2000年1月7日（甲子日）为起算点
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 干支信息
 */
export function getDayGanZhi(jd: number): GanZhiInfo {
  // 2000年1月7日为甲子日，对应 J2000 + 6
  // 为确保正数，加上9000000
  const dayOffset = Math.floor(jd) - 6 + 9000000;
  return getGanZhi(dayOffset);
}

/**
 * 干支纪时
 *
 * 时辰与地支对应：
 * 子时(23:00-01:00), 丑时(01:00-03:00), ...
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 干支信息
 */
export function getHourGanZhi(jd: number): GanZhiInfo {
  // 获取当日干支
  const dayGanZhi = getDayGanZhi(jd);

  // 计算时辰 (0-11)
  // 儒略日中午12点为整数，需要加0.5使0点为整数
  const dayFraction = (jd + 0.5) % 1;
  const hour = Math.floor(dayFraction * 24);

  // 转换为时辰索引 (子时从23点开始)
  let shiChen = Math.floor((hour + 1) / 2) % 12;

  // 根据日干计算时干
  // 甲己日起甲子时，乙庚日起丙子时，丙辛日起戊子时，丁壬日起庚子时，戊癸日起壬子时
  const dayGanBase = [0, 2, 4, 6, 8][dayGanZhi.ganIndex % 5];
  const hourIndex = dayGanBase * 12 + shiChen;

  return getGanZhi(hourIndex);
}

/**
 * 获取生肖
 *
 * @param jd - 儒略日 (J2000起算)
 * @param useLichun - 是否以立春为界，默认true
 * @returns 生肖
 */
export function getShengXiao(jd: number, useLichun: boolean = true): string {
  const ganZhi = useLichun ? getYearGanZhi(jd) : getYearGanZhiBySpring(jd);
  return SHENG_XIAO[ganZhi.zhiIndex];
}

/**
 * 获取星座
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 星座名称
 */
export function getXingZuo(jd: number): string {
  const yearData = calculateLunarYear(jd);

  // 星座所在月的序数
  let constellationIndex = Math.floor((jd - yearData.zhongQi[0] - 15) / 30.43685);
  if (constellationIndex < 11 && jd >= yearData.zhongQi[2 * constellationIndex + 2]) {
    constellationIndex++;
  }

  return XING_ZUO[(constellationIndex + 12) % 12] + '座';
}

/**
 * 完整的干支纪年月日时信息
 */
export interface FullGanZhiInfo {
  /** 年干支 (立春为界) */
  year: GanZhiInfo;
  /** 年干支 (正月初一为界) */
  yearBySpring: GanZhiInfo;
  /** 月干支 */
  month: GanZhiInfo;
  /** 日干支 */
  day: GanZhiInfo;
  /** 时干支 */
  hour: GanZhiInfo;
  /** 生肖 */
  shengXiao: string;
  /** 星座 */
  xingZuo: string;
}

/**
 * 获取完整的干支信息
 *
 * @param jd - 儒略日 (J2000起算)
 * @returns 完整干支信息
 */
export function getFullGanZhi(jd: number): FullGanZhiInfo {
  return {
    year: getYearGanZhi(jd),
    yearBySpring: getYearGanZhiBySpring(jd),
    month: getMonthGanZhi(jd),
    day: getDayGanZhi(jd),
    hour: getHourGanZhi(jd),
    shengXiao: getShengXiao(jd),
    xingZuo: getXingZuo(jd),
  };
}

/**
 * 将干支转换为索引
 *
 * @param ganZhi - 干支字符串（如"甲子"）
 * @returns 干支索引 (0-59)，无效返回-1
 */
export function ganZhiToIndex(ganZhi: string): number {
  if (ganZhi.length !== 2) return -1;

  const ganIndex = TIAN_GAN.indexOf(ganZhi[0] as typeof TIAN_GAN[number]);
  const zhiIndex = DI_ZHI.indexOf(ganZhi[1] as typeof DI_ZHI[number]);

  if (ganIndex === -1 || zhiIndex === -1) return -1;

  // 验证干支组合是否有效（干和支的奇偶性必须相同）
  if (ganIndex % 2 !== zhiIndex % 2) return -1;

  // 计算六十甲子索引
  for (let i = 0; i < 60; i++) {
    if (i % 10 === ganIndex && i % 12 === zhiIndex) {
      return i;
    }
  }

  return -1;
}

/**
 * 六十甲子表
 */
export const JIA_ZI_TABLE: readonly string[] = [];
for (let i = 0; i < 60; i++) {
  (JIA_ZI_TABLE as string[]).push(TIAN_GAN[i % 10] + DI_ZHI[i % 12]);
}
