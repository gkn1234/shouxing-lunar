/**
 * 月食计算测试 - Lunar Eclipse Calculation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateLunarEclipse,
  findLunarEclipses,
  findNextLunarEclipse,
  getLunarEclipseTypeName,
  convertToAbsoluteJd,
} from '../../src/eclipse';
import { gregorianToJD } from '../../src/core/julian';
import { J2000 } from '../../src/core/constants';

describe('月食计算 - Lunar Eclipse Calculation', () => {
  describe('calculateLunarEclipse', () => {
    it('应该能计算2021年5月26日月全食', () => {
      // 2021年5月26日 月全食
      const jd = gregorianToJD(2021, 5, 26) - J2000;
      const eclipse = calculateLunarEclipse(jd);

      expect(eclipse.type).toBe('total');
      expect(eclipse.magnitude).toBeGreaterThan(1);
    });

    it('应该能计算2021年11月19日月偏食', () => {
      // 2021年11月19日 月偏食
      const jd = gregorianToJD(2021, 11, 19) - J2000;
      const eclipse = calculateLunarEclipse(jd);

      expect(eclipse.type).toBe('partial');
      expect(eclipse.magnitude).toBeGreaterThan(0);
      expect(eclipse.magnitude).toBeLessThan(1);
    });

    it('应该能计算2022年5月16日月全食', () => {
      // 2022年5月16日 月全食
      const jd = gregorianToJD(2022, 5, 16) - J2000;
      const eclipse = calculateLunarEclipse(jd);

      expect(eclipse.type).toBe('total');
      expect(eclipse.magnitude).toBeGreaterThan(1);
    });

    it('应该能计算2023年10月28日月偏食', () => {
      // 2023年10月28日 月偏食
      const jd = gregorianToJD(2023, 10, 28) - J2000;
      const eclipse = calculateLunarEclipse(jd);

      expect(eclipse.type).toBe('partial');
    });

    it('无月食时应返回none类型', () => {
      // 2021年1月28日 满月但无月食
      const jd = gregorianToJD(2021, 1, 28) - J2000;
      const eclipse = calculateLunarEclipse(jd);

      // 可能是半影月食或无月食
      expect(['none', 'penumbral']).toContain(eclipse.type);
    });

    it('应返回有效的月食时间点', () => {
      const jd = gregorianToJD(2021, 5, 26) - J2000;
      const eclipse = calculateLunarEclipse(jd);

      // 全食应有所有时间点
      if (eclipse.type === 'total') {
        expect(eclipse.times.maximum).toBeGreaterThan(0);
        expect(eclipse.times.penumbralStart).toBeGreaterThan(0);
        expect(eclipse.times.penumbralEnd).toBeGreaterThan(0);
        expect(eclipse.times.partialStart).toBeGreaterThan(0);
        expect(eclipse.times.partialEnd).toBeGreaterThan(0);
        expect(eclipse.times.totalStart).toBeGreaterThan(0);
        expect(eclipse.times.totalEnd).toBeGreaterThan(0);

        // 时间顺序验证 - 半影最先开始
        expect(eclipse.times.penumbralStart).toBeLessThan(eclipse.times.partialStart);
        expect(eclipse.times.partialStart).toBeLessThan(eclipse.times.totalStart);
        // 全食结束后是偏食复圆
        expect(eclipse.times.totalEnd).toBeLessThan(eclipse.times.partialEnd);
        expect(eclipse.times.partialEnd).toBeLessThan(eclipse.times.penumbralEnd);

        // 食甚应接近全食期间的中点 (允许小误差)
        const totalMidpoint = (eclipse.times.totalStart + eclipse.times.totalEnd) / 2;
        expect(Math.abs(eclipse.times.maximum - totalMidpoint)).toBeLessThan(0.1); // 0.1天 = 2.4小时
      }
    });

    it('应返回有效的影子半径', () => {
      const jd = gregorianToJD(2021, 5, 26) - J2000;
      const eclipse = calculateLunarEclipse(jd);

      expect(eclipse.moonRadius).toBeGreaterThan(800); // 约900-1000角秒
      expect(eclipse.moonRadius).toBeLessThan(1100);

      // 本影半径约 2500-3500 角秒 (约40-60角分)
      expect(eclipse.umbraRadius).toBeGreaterThan(2000);
      expect(eclipse.umbraRadius).toBeLessThan(4000);

      // 半影半径约 4000-6000 角秒
      expect(eclipse.penumbraRadius).toBeGreaterThan(3000);
      expect(eclipse.penumbraRadius).toBeLessThan(7000);
    });
  });

  describe('findLunarEclipses', () => {
    it('应该能找到2021年的月食', () => {
      const eclipses = findLunarEclipses(2021, 2022, false);

      // 2021年有2次月食 (1次全食 + 1次偏食)
      expect(eclipses.length).toBeGreaterThanOrEqual(2);
    });

    it('应该能找到2022年的月食', () => {
      const eclipses = findLunarEclipses(2022, 2023, false);

      // 2022年有2次月全食 (5月和11月)
      expect(eclipses.length).toBeGreaterThanOrEqual(2);
    });

    it('包含半影月食选项应返回更多结果', () => {
      const withoutPenumbral = findLunarEclipses(2020, 2025, false);
      const withPenumbral = findLunarEclipses(2020, 2025, true);

      expect(withPenumbral.length).toBeGreaterThanOrEqual(withoutPenumbral.length);
    });
  });

  describe('findNextLunarEclipse', () => {
    it('应该能从2021年1月找到下一次月食', () => {
      const jd = gregorianToJD(2021, 1, 1) - J2000;
      const eclipse = findNextLunarEclipse(jd, false);

      expect(eclipse.type).not.toBe('none');
      expect(eclipse.times.maximum).toBeGreaterThan(jd);
    });

    it('应该能从任意日期找到下一次月食', () => {
      const jd = gregorianToJD(2023, 1, 1) - J2000;
      const eclipse = findNextLunarEclipse(jd, false);

      expect(eclipse.type).not.toBe('none');
    });
  });

  describe('getLunarEclipseTypeName', () => {
    it('应返回正确的中文名称', () => {
      expect(getLunarEclipseTypeName('total')).toBe('月全食');
      expect(getLunarEclipseTypeName('partial')).toBe('月偏食');
      expect(getLunarEclipseTypeName('penumbral')).toBe('半影月食');
      expect(getLunarEclipseTypeName('none')).toBe('无月食');
    });
  });

  describe('convertToAbsoluteJd', () => {
    it('应正确转换儒略日', () => {
      const jd = gregorianToJD(2021, 5, 26) - J2000;
      const eclipse = calculateLunarEclipse(jd);
      const absoluteTimes = convertToAbsoluteJd(eclipse.times);

      if (eclipse.times.maximum > 0) {
        expect(absoluteTimes.maximum).toBeCloseTo(eclipse.times.maximum + J2000, 5);
      }
    });
  });
});

describe('月食计算精度测试', () => {
  it('2021年5月26日月全食时间精度检验', () => {
    // NASA数据: 食甚约 11:19 UTC
    const jd = gregorianToJD(2021, 5, 26) - J2000;
    const eclipse = calculateLunarEclipse(jd);

    expect(eclipse.type).toBe('total');

    // 检查食甚时间是否在5月26日附近
    const maxJd = eclipse.times.maximum + J2000;
    const expectedJd = gregorianToJD(2021, 5, 26) + 11 / 24; // 约11:00 UTC

    // 允许1小时误差
    expect(Math.abs(maxJd - expectedJd)).toBeLessThan(1 / 24);
  });

  it('2022年5月16日月全食时间精度检验', () => {
    // NASA数据: 食甚约 04:12 UTC
    const jd = gregorianToJD(2022, 5, 16) - J2000;
    const eclipse = calculateLunarEclipse(jd);

    expect(eclipse.type).toBe('total');

    // 检查食甚时间是否在5月16日附近
    const maxJd = eclipse.times.maximum + J2000;
    const expectedJd = gregorianToJD(2022, 5, 16) + 4 / 24; // 约04:00 UTC

    // 允许1小时误差
    expect(Math.abs(maxJd - expectedJd)).toBeLessThan(1 / 24);
  });
});
