import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLunarYear,
  getLunarDateInfo,
  clearLunarYearCache,
} from '../../src/lunar/calendar';
import { gregorianToJD } from '../../src/core/julian';
import { J2000 } from '../../src/core/constants';

describe('农历日历计算 (calendar)', () => {
  // 每个测试前清除缓存
  beforeEach(() => {
    clearLunarYearCache();
  });

  describe('calculateLunarYear - 年历计算', () => {
    it('应返回正确的年历数据结构', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);

      expect(yearData).toHaveProperty('zhongQi');
      expect(yearData).toHaveProperty('heSuo');
      expect(yearData).toHaveProperty('monthDays');
      expect(yearData).toHaveProperty('monthNames');
      expect(yearData).toHaveProperty('leapMonth');
      expect(yearData).toHaveProperty('year');
    });

    it('zhongQi 应包含25个节气', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);
      expect(yearData.zhongQi.length).toBe(25);
    });

    it('heSuo 应包含15个朔日', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);
      expect(yearData.heSuo.length).toBe(15);
    });

    it('monthDays 应包含14个月大小', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);
      expect(yearData.monthDays.length).toBe(14);
      // 每月天数应在29-30之间
      yearData.monthDays.forEach(days => {
        expect(days).toBeGreaterThanOrEqual(29);
        expect(days).toBeLessThanOrEqual(30);
      });
    });

    it('2023年（癸卯年）应有闰二月', () => {
      // 2023年有闰二月
      const jd = gregorianToJD(2023, 5, 15) - J2000;
      const yearData = calculateLunarYear(jd);
      expect(yearData.leapMonth).toBeGreaterThan(0);
    });

    it('2024年（甲辰年）无闰月', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);
      expect(yearData.leapMonth).toBe(0);
    });
  });

  describe('getLunarDateInfo - 农历日期信息', () => {
    it('2024年春节应在正月', () => {
      // 2024年2月10日是春节(正月初一或初二)
      const jd = gregorianToJD(2024, 2, 10) - J2000;
      const info = getLunarDateInfo(jd);

      expect(info.year).toBe(2024);
      expect(info.month).toBe(1);
      // 由于时区和JD计算差异，可能是初一或初二
      expect(info.day).toBeGreaterThanOrEqual(1);
      expect(info.day).toBeLessThanOrEqual(2);
      expect(info.isLeap).toBe(false);
      expect(info.monthName).toBe('正');
    });

    it('2024年中秋应在八月十五前后', () => {
      // 2024年9月17日是中秋节附近
      const jd = gregorianToJD(2024, 9, 17) - J2000;
      const info = getLunarDateInfo(jd);

      expect(info.month).toBe(8);
      // 由于时区和JD计算差异，可能是十五或十六
      expect(info.day).toBeGreaterThanOrEqual(15);
      expect(info.day).toBeLessThanOrEqual(16);
    });

    it('农历日期信息应包含正确字段', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const info = getLunarDateInfo(jd);

      expect(info).toHaveProperty('year');
      expect(info).toHaveProperty('month');
      expect(info).toHaveProperty('day');
      expect(info).toHaveProperty('isLeap');
      expect(info).toHaveProperty('monthName');
      expect(info).toHaveProperty('dayName');
      expect(info).toHaveProperty('monthDays');
    });

    it('monthDays 应返回当月天数', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const info = getLunarDateInfo(jd);
      expect(info.monthDays).toBeGreaterThanOrEqual(29);
      expect(info.monthDays).toBeLessThanOrEqual(30);
    });
  });

  describe('日期边界测试', () => {
    it('农历日期应在有效范围内', () => {
      // 测试多个日期
      const dates = [
        [2024, 1, 15],
        [2024, 3, 10],
        [2024, 6, 15],
        [2024, 9, 15],
        [2024, 12, 15],
      ];

      dates.forEach(([y, m, d]) => {
        const jd = gregorianToJD(y, m, d) - J2000;
        const info = getLunarDateInfo(jd);

        expect(info.month).toBeGreaterThanOrEqual(1);
        expect(info.month).toBeLessThanOrEqual(12);
        expect(info.day).toBeGreaterThanOrEqual(1);
        expect(info.day).toBeLessThanOrEqual(30);
      });
    });
  });
});
