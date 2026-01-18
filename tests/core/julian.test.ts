import { describe, it, expect } from 'vitest';
import {
  gregorianToJD,
  jdToGregorian,
  jdToString,
  jdToTimeString,
  getWeekDay,
  getNthWeekDay,
  JD,
} from '../../src/core/julian';
import { J2000 } from '../../src/core/constants';

describe('儒略日计算 (julian)', () => {
  describe('gregorianToJD - 公历转儒略日', () => {
    it('J2000 基准日期应该返回 2451545', () => {
      // 2000年1月1日12时 = J2000
      expect(gregorianToJD(2000, 1, 1.5)).toBe(J2000);
    });

    it('1582年10月15日应该返回 2299160.5', () => {
      // 格里高利历起始日
      expect(gregorianToJD(1582, 10, 15)).toBeCloseTo(2299160.5, 5);
    });

    it('应该正确处理负年份', () => {
      // 公元前4713年1月1日12时 = 儒略日0
      expect(gregorianToJD(-4712, 1, 1.5)).toBeCloseTo(0, 1);
    });

    it('2024年2月29日 (闰年)', () => {
      const jd = gregorianToJD(2024, 2, 29.5);
      expect(jd).toBeCloseTo(2460370, 0);
    });
  });

  describe('jdToGregorian - 儒略日转公历', () => {
    it('J2000 应该转换为 2000-01-01 12:00:00', () => {
      const result = jdToGregorian(J2000);
      expect(result.year).toBe(2000);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.hour).toBe(12);
      expect(result.minute).toBe(0);
      expect(result.second).toBeCloseTo(0, 5);
    });

    it('应该正确转换带时间的儒略日', () => {
      // 2000年1月1日 18:00 = J2000 + 0.25
      const result = jdToGregorian(J2000 + 0.25);
      expect(result.year).toBe(2000);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.hour).toBe(18);
    });
  });

  describe('jdToString - 儒略日转字符串', () => {
    it('应该返回正确格式的日期字符串', () => {
      const str = jdToString(J2000);
      expect(str).toBe('2000-01-01 12:00:00');
    });
  });

  describe('jdToTimeString - 提取时间字符串', () => {
    it('J2000 应该返回 12:00:00', () => {
      expect(jdToTimeString(J2000)).toBe('12:00:00');
    });

    it('J2000 + 0.25 应该返回 18:00:00', () => {
      expect(jdToTimeString(J2000 + 0.25)).toBe('18:00:00');
    });
  });

  describe('getWeekDay - 计算星期', () => {
    it('2000年1月1日是星期六', () => {
      expect(getWeekDay(J2000)).toBe(6); // 周六
    });

    it('2024年1月1日是星期一', () => {
      const jd = gregorianToJD(2024, 1, 1.5);
      expect(getWeekDay(jd)).toBe(1); // 周一
    });
  });

  describe('getNthWeekDay - 求第n个星期w', () => {
    it('2024年11月第4个星期四 (美国感恩节)', () => {
      const jd = getNthWeekDay(2024, 11, 4, 4);
      const result = jdToGregorian(jd);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(11);
      expect(result.day).toBe(28);
    });

    it('2024年5月第2个星期日 (母亲节)', () => {
      const jd = getNthWeekDay(2024, 5, 2, 0);
      const result = jdToGregorian(jd);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(5);
      expect(result.day).toBe(12);
    });
  });

  describe('JD 类', () => {
    it('应该能够设置和转换日期', () => {
      const jd = new JD();
      jd.year = 2024;
      jd.month = 6;
      jd.day = 15;
      jd.hour = 12;
      jd.minute = 0;
      jd.second = 0;

      const julianDay = jd.toJD();
      expect(julianDay).toBeCloseTo(gregorianToJD(2024, 6, 15.5), 5);
    });

    it('setFromJD 应该正确设置状态', () => {
      const jd = new JD();
      jd.setFromJD(J2000);

      expect(jd.year).toBe(2000);
      expect(jd.month).toBe(1);
      expect(jd.day).toBe(1);
      expect(jd.hour).toBe(12);
    });
  });

  describe('往返转换测试', () => {
    const testDates = [
      [2000, 1, 1.5],
      [2024, 2, 29.5],
      [1900, 6, 15.75],
      [-500, 3, 10.25],
      [3000, 12, 31.999],
    ];

    testDates.forEach(([year, month, day]) => {
      it(`${year}-${month}-${day} 往返转换应该保持一致`, () => {
        const jd = gregorianToJD(year, month, day);
        const result = jdToGregorian(jd);
        const dayFraction = ((result.second / 60 + result.minute) / 60 + result.hour) / 24;
        const jd2 = gregorianToJD(result.year, result.month, result.day + dayFraction);
        expect(jd2).toBeCloseTo(jd, 8);
      });
    });
  });
});
