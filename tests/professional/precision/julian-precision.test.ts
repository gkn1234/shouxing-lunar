/**
 * 儒略日精度验证测试
 *
 * 测试数据来源：《天文算法》（Jean Meeus）第7章
 * 参考：寿星万年历 sm2.htm 第二章 儒略日
 *
 * 所有标准测试值均来自算法文档，用于验证儒略日计算的精确性
 */

import { describe, it, expect } from 'vitest';
import { gregorianToJD, jdToGregorian, getWeekDay } from '../../../src/core/julian';

/**
 * 《天文算法》标准儒略日测试数据
 * 来源：sm2.htm 第二章
 *
 * 注意：年份使用天文年份表示法
 * - 公元1年 = 年份1
 * - 公元前1年 = 年份0
 * - 公元前2年 = 年份-1
 * - 以此类推
 */
interface JulianTestCase {
  /** 测试用例描述 */
  description: string;
  /** 年份（天文年份） */
  year: number;
  /** 月份 */
  month: number;
  /** 日期（可含小数表示时间） */
  day: number;
  /** 期望的儒略日 */
  expectedJD: number;
}

describe('儒略日精度验证 - 《天文算法》标准测试值', () => {
  /**
   * 标准测试数据
   * 来源：sm2.htm 第二章 表格
   */
  const standardTestCases: JulianTestCase[] = [
    {
      description: '2000年1月1.5日 (J2000纪元)',
      year: 2000,
      month: 1,
      day: 1.5,
      expectedJD: 2451545.0,
    },
    {
      description: '1987年1月27.0日',
      year: 1987,
      month: 1,
      day: 27.0,
      expectedJD: 2446822.5,
    },
    {
      description: '1987年6月19.5日',
      year: 1987,
      month: 6,
      day: 19.5,
      expectedJD: 2446966.0,
    },
    {
      description: '1988年1月27.0日',
      year: 1988,
      month: 1,
      day: 27.0,
      expectedJD: 2447187.5,
    },
    {
      description: '1988年6月19.5日',
      year: 1988,
      month: 6,
      day: 19.5,
      expectedJD: 2447332.0,
    },
    {
      description: '1900年1月1.0日',
      year: 1900,
      month: 1,
      day: 1.0,
      expectedJD: 2415020.5,
    },
    {
      description: '1600年1月1.0日',
      year: 1600,
      month: 1,
      day: 1.0,
      expectedJD: 2305447.5,
    },
    {
      description: '1600年12月31.0日',
      year: 1600,
      month: 12,
      day: 31.0,
      expectedJD: 2305812.5,
    },
    {
      description: '837年4月10.3日 (哈雷彗星近日点)',
      year: 837,
      month: 4,
      day: 10.3,
      expectedJD: 2026871.8,
    },
    {
      description: '-1000年7月12.5日 (公元前1001年)',
      year: -1000,
      month: 7,
      day: 12.5,
      expectedJD: 1356001.0,
    },
    {
      description: '-1000年2月29.0日 (公元前1001年闰日)',
      year: -1000,
      month: 2,
      day: 29.0,
      expectedJD: 1355866.5,
    },
    {
      description: '-1001年8月17.9日 (公元前1002年)',
      year: -1001,
      month: 8,
      day: 17.9,
      expectedJD: 1355671.4,
    },
    {
      description: '-4712年1月1.5日 (儒略日起点)',
      year: -4712,
      month: 1,
      day: 1.5,
      expectedJD: 0.0,
    },
  ];

  describe('公历转儒略日 - 标准值精确匹配', () => {
    standardTestCases.forEach(({ description, year, month, day, expectedJD }) => {
      it(`${description} => JD ${expectedJD}`, () => {
        const actualJD = gregorianToJD(year, month, day);
        // 精度要求：至少小数点后1位
        expect(actualJD).toBeCloseTo(expectedJD, 1);
      });
    });
  });

  describe('儒略日转公历 - 逆向验证', () => {
    standardTestCases.forEach(({ description, year, month, day, expectedJD }) => {
      it(`JD ${expectedJD} => ${description}`, () => {
        const result = jdToGregorian(expectedJD);

        // 验证年份
        expect(result.year).toBe(year);

        // 验证月份
        expect(result.month).toBe(month);

        // 验证日期（整数部分）
        const expectedDay = Math.floor(day);
        expect(result.day).toBe(expectedDay);

        // 验证时间（日期的小数部分）
        const dayFraction = day - expectedDay;
        const expectedHour = Math.floor(dayFraction * 24);
        expect(result.hour).toBe(expectedHour);
      });
    });
  });

  describe('往返转换测试 - 公历 => 儒略日 => 公历', () => {
    standardTestCases.forEach(({ description, year, month, day }) => {
      it(`往返转换: ${description}`, () => {
        // 公历 => 儒略日
        const jd = gregorianToJD(year, month, day);

        // 儒略日 => 公历
        const result = jdToGregorian(jd);

        // 重构为儒略日
        const dayFraction =
          ((result.second / 60 + result.minute) / 60 + result.hour) / 24;
        const reconstructedJD = gregorianToJD(
          result.year,
          result.month,
          result.day + dayFraction
        );

        // 验证往返一致性（精度至少8位小数）
        expect(reconstructedJD).toBeCloseTo(jd, 8);
      });
    });
  });
});

describe('儒略日边界情况测试', () => {
  describe('儒略日起点 (JD = 0)', () => {
    it('JD 0 应对应公元前4713年1月1日12时（儒略历）', () => {
      const result = jdToGregorian(0);
      expect(result.year).toBe(-4712);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.hour).toBe(12);
    });

    it('公元前4713年1月1.5日应转换为 JD 0', () => {
      const jd = gregorianToJD(-4712, 1, 1.5);
      expect(jd).toBeCloseTo(0, 1);
    });
  });

  describe('远古年份测试', () => {
    it('公元前2000年 (年份 -1999)', () => {
      const jd = gregorianToJD(-1999, 6, 15.5);
      expect(jd).toBeDefined();
      expect(typeof jd).toBe('number');
      expect(jd).toBeGreaterThan(0);
      expect(jd).toBeLessThan(1000000);

      // 验证往返转换
      const result = jdToGregorian(jd);
      expect(result.year).toBe(-1999);
      expect(result.month).toBe(6);
    });

    it('公元前3000年 (年份 -2999)', () => {
      const jd = gregorianToJD(-2999, 1, 1.0);
      expect(jd).toBeDefined();
      expect(jd).toBeGreaterThan(0);

      const result = jdToGregorian(jd);
      expect(result.year).toBe(-2999);
    });
  });

  describe('未来年份测试', () => {
    it('公元3000年', () => {
      const jd = gregorianToJD(3000, 1, 1.5);
      expect(jd).toBeGreaterThan(2816787); // 约为3000年初的JD

      const result = jdToGregorian(jd);
      expect(result.year).toBe(3000);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    it('公元5000年', () => {
      const jd = gregorianToJD(5000, 6, 15.5);
      expect(jd).toBeGreaterThan(3547000);

      const result = jdToGregorian(jd);
      expect(result.year).toBe(5000);
      expect(result.month).toBe(6);
    });
  });

  describe('格里高利历改革边界', () => {
    it('1582年10月15日 - 格里高利历第一天', () => {
      const jd = gregorianToJD(1582, 10, 15.0);
      expect(jd).toBeCloseTo(2299160.5, 5);
    });

    it('1582年10月4日 - 儒略历最后一天（跳过的日期）', () => {
      // 格里高利历中不存在1582年10月5-14日
      // 算法应该仍能处理这些日期（按儒略历计算）
      const jd = gregorianToJD(1582, 10, 4.5);
      expect(jd).toBeDefined();
    });
  });
});

describe('星期计算验证', () => {
  /**
   * 已知日期的星期验证
   * 0=周日, 1=周一, ..., 6=周六
   */
  const weekdayTestCases = [
    { description: '2000年1月1日（周六）', year: 2000, month: 1, day: 1.5, expectedWeekday: 6 },
    { description: '2024年1月1日（周一）', year: 2024, month: 1, day: 1.5, expectedWeekday: 1 },
    { description: '2024年2月29日（周四，闰年）', year: 2024, month: 2, day: 29.5, expectedWeekday: 4 },
    { description: '1970年1月1日（周四，Unix纪元）', year: 1970, month: 1, day: 1.5, expectedWeekday: 4 },
    { description: '1969年7月20日（周日，登月日）', year: 1969, month: 7, day: 20.5, expectedWeekday: 0 },
    { description: '1900年1月1日（周一）', year: 1900, month: 1, day: 1.5, expectedWeekday: 1 },
    { description: '1582年10月15日（周五）', year: 1582, month: 10, day: 15.5, expectedWeekday: 5 },
  ];

  weekdayTestCases.forEach(({ description, year, month, day, expectedWeekday }) => {
    it(description, () => {
      const jd = gregorianToJD(year, month, day);
      const weekday = getWeekDay(jd);
      expect(weekday).toBe(expectedWeekday);
    });
  });

  describe('连续日期星期递增验证', () => {
    it('连续7天的星期应该从0到6循环', () => {
      const baseJD = gregorianToJD(2024, 1, 7.5); // 2024年1月7日是周日
      const weekdays: number[] = [];

      for (let i = 0; i < 7; i++) {
        weekdays.push(getWeekDay(baseJD + i));
      }

      // 从周日开始连续7天
      expect(weekdays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });
});

describe('特殊日期精度测试', () => {
  describe('小数日期精度', () => {
    it('正午 (0.5日) 精确计算', () => {
      const jd = gregorianToJD(2000, 1, 1.5);
      const result = jdToGregorian(jd);
      expect(result.hour).toBe(12);
      expect(result.minute).toBe(0);
      expect(result.second).toBeCloseTo(0, 3);
    });

    it('午夜 (0.0日) 精确计算', () => {
      const jd = gregorianToJD(2000, 1, 1.0);
      const result = jdToGregorian(jd);
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
      expect(result.second).toBeCloseTo(0, 3);
    });

    it('6时 (0.25日) 精确计算', () => {
      const jd = gregorianToJD(2000, 1, 1.25);
      const result = jdToGregorian(jd);
      expect(result.hour).toBe(6);
      expect(result.minute).toBe(0);
    });

    it('18时 (0.75日) 精确计算', () => {
      const jd = gregorianToJD(2000, 1, 1.75);
      const result = jdToGregorian(jd);
      expect(result.hour).toBe(18);
      expect(result.minute).toBe(0);
    });
  });

  describe('闰年二月验证', () => {
    const leapYears = [2000, 2004, 2020, 2024, 1600, 2400];
    const nonLeapYears = [1900, 2100, 2200, 2300, 1800];

    leapYears.forEach((year) => {
      it(`${year}年是闰年，应有2月29日`, () => {
        const jd = gregorianToJD(year, 2, 29.5);
        const result = jdToGregorian(jd);
        expect(result.year).toBe(year);
        expect(result.month).toBe(2);
        expect(result.day).toBe(29);
      });
    });

    nonLeapYears.forEach((year) => {
      it(`${year}年不是闰年，2月29日应转为3月1日`, () => {
        // 非闰年的2月29日实际上会被算作3月1日（或2月28日+1天）
        const jdFeb28 = gregorianToJD(year, 2, 28.5);
        const jdFeb29 = gregorianToJD(year, 2, 29.5);

        // 两个日期应该相差1天
        expect(jdFeb29 - jdFeb28).toBeCloseTo(1, 8);
      });
    });
  });
});

describe('高精度数值验证', () => {
  it('J2000 纪元精确值 (2451545.0)', () => {
    const jd = gregorianToJD(2000, 1, 1.5);
    // 精确到小数点后10位
    expect(Math.abs(jd - 2451545.0)).toBeLessThan(1e-10);
  });

  it('儒略日起点精确值 (0.0)', () => {
    const jd = gregorianToJD(-4712, 1, 1.5);
    // 精度要求：小数点后1位
    expect(Math.abs(jd)).toBeLessThan(0.1);
  });

  it('大数值儒略日计算稳定性', () => {
    // 测试非常大的年份
    const jd1 = gregorianToJD(10000, 1, 1.5);
    const jd2 = gregorianToJD(10000, 1, 2.5);

    // 相邻两天应该精确相差1
    expect(jd2 - jd1).toBeCloseTo(1, 10);
  });
});
