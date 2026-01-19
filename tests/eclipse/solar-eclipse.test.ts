/**
 * 日食计算测试 - Solar Eclipse Calculation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  searchSolarEclipseFast,
  calculateSolarEclipse,
  findSolarEclipses,
  findNextSolarEclipse,
  getSolarEclipseTypeName,
  isCentralEclipse,
  isTotalEclipse,
  isAnnularEclipse,
} from '../../src/eclipse';
import { gregorianToJD } from '../../src/core/julian';
import { J2000 } from '../../src/core/constants';

describe('日食计算 - Solar Eclipse Calculation', () => {
  describe('searchSolarEclipseFast', () => {
    it('应该能检测2024年4月8日的日全食', () => {
      // 2024年4月8日 日全食 (北美)
      const jd = gregorianToJD(2024, 4, 8) - J2000;
      const result = searchSolarEclipseFast(jd);

      expect(result.type).not.toBe('N');
      // 应该是中心食或边缘食 (全食、环食或混合食)
      expect(['T', 'T0', 'T1', 'A', 'A0', 'A1', 'H', 'H2', 'H3']).toContain(result.type);
    });

    it('应该能检测2023年10月14日的日环食', () => {
      // 2023年10月14日 日环食 (美洲)
      const jd = gregorianToJD(2023, 10, 14) - J2000;
      const result = searchSolarEclipseFast(jd);

      expect(result.type).not.toBe('N');
      // 应该是环食
      expect(['A', 'A0', 'A1', 'H', 'H2', 'H3']).toContain(result.type);
    });

    it('应该能检测2021年6月10日的日环食', () => {
      // 2021年6月10日 日环食
      const jd = gregorianToJD(2021, 6, 10) - J2000;
      const result = searchSolarEclipseFast(jd);

      expect(result.type).not.toBe('N');
    });

    it('应该能检测2020年6月21日的日环食', () => {
      // 2020年6月21日 日环食 (亚洲)
      const jd = gregorianToJD(2020, 6, 21) - J2000;
      const result = searchSolarEclipseFast(jd);

      expect(result.type).not.toBe('N');
    });

    it('无日食时应返回N类型', () => {
      // 2021年3月13日 新月但无日食
      const jd = gregorianToJD(2021, 3, 13) - J2000;
      const result = searchSolarEclipseFast(jd);

      expect(result.type).toBe('N');
    });

    it('应返回有效的伽马值', () => {
      const jd = gregorianToJD(2024, 4, 8) - J2000;
      const result = searchSolarEclipseFast(jd);

      // 伽马值应在 -1.5 到 1.5 之间
      expect(result.gamma).toBeGreaterThan(-1.5);
      expect(result.gamma).toBeLessThan(1.5);
    });
  });

  describe('calculateSolarEclipse', () => {
    it('应该能计算2024年4月8日日食详情', () => {
      const jd = gregorianToJD(2024, 4, 8) - J2000;
      const eclipse = calculateSolarEclipse(jd);

      expect(eclipse).not.toBeNull();
      if (eclipse) {
        // 应该是非偏食
        expect(eclipse.type).not.toBe('P');
        expect(eclipse.type).not.toBe('N');
      }
    });

    it('应该能计算2023年10月14日日环食详情', () => {
      const jd = gregorianToJD(2023, 10, 14) - J2000;
      const eclipse = calculateSolarEclipse(jd);

      expect(eclipse).not.toBeNull();
      if (eclipse) {
        expect(isAnnularEclipse(eclipse.type)).toBe(true);
      }
    });

    it('无日食时应返回null', () => {
      const jd = gregorianToJD(2021, 3, 13) - J2000;
      const eclipse = calculateSolarEclipse(jd);

      expect(eclipse).toBeNull();
    });
  });

  describe('findSolarEclipses', () => {
    it('应该能找到2020-2025年间的日食', () => {
      const eclipses = findSolarEclipses(2020, 2025, true);

      // 每年约有2-5次日食
      expect(eclipses.length).toBeGreaterThanOrEqual(10);
      expect(eclipses.length).toBeLessThanOrEqual(30);
    });

    it('应该能找到2021年的日食', () => {
      const eclipses = findSolarEclipses(2021, 2022, true);

      // 2021年有2次日食
      expect(eclipses.length).toBeGreaterThanOrEqual(2);
    });

    it('不包含偏食选项应返回更少结果', () => {
      const withPartial = findSolarEclipses(2020, 2025, true);
      const withoutPartial = findSolarEclipses(2020, 2025, false);

      expect(withoutPartial.length).toBeLessThanOrEqual(withPartial.length);
    });

    it('应该返回正确的日食类型', () => {
      const eclipses = findSolarEclipses(2020, 2025, true);

      for (const eclipse of eclipses) {
        expect(['N', 'P', 'A', 'T', 'H', 'A0', 'T0', 'A1', 'T1', 'H2', 'H3']).toContain(eclipse.type);
        expect(eclipse.type).not.toBe('N');
      }
    });
  });

  describe('findNextSolarEclipse', () => {
    it('应该能从2021年1月找到下一次日食', () => {
      const jd = gregorianToJD(2021, 1, 1) - J2000;
      const eclipse = findNextSolarEclipse(jd, true);

      expect(eclipse).not.toBeNull();
      expect(eclipse.newMoonJd).toBeGreaterThan(jd + J2000);
    });

    it('应该能找到下一次中心食', () => {
      const jd = gregorianToJD(2021, 1, 1) - J2000;
      const eclipse = findNextSolarEclipse(jd, false);

      expect(eclipse).not.toBeNull();
      // 不包含偏食，应该是中心食或边缘食
      expect(eclipse.type).not.toBe('P');
    });
  });

  describe('getSolarEclipseTypeName', () => {
    it('应返回正确的中文名称', () => {
      expect(getSolarEclipseTypeName('N')).toBe('无日食');
      expect(getSolarEclipseTypeName('P')).toBe('日偏食');
      expect(getSolarEclipseTypeName('A')).toBe('日环食');
      expect(getSolarEclipseTypeName('T')).toBe('日全食');
      expect(getSolarEclipseTypeName('H')).toBe('全环食');
      expect(getSolarEclipseTypeName('A0')).toBe('日环食(无中心)');
      expect(getSolarEclipseTypeName('T0')).toBe('日全食(无中心)');
      expect(getSolarEclipseTypeName('A1')).toBe('日环食(边缘)');
      expect(getSolarEclipseTypeName('T1')).toBe('日全食(边缘)');
    });
  });

  describe('日食类型判断函数', () => {
    it('isCentralEclipse 应正确判断', () => {
      expect(isCentralEclipse('T')).toBe(true);
      expect(isCentralEclipse('A')).toBe(true);
      expect(isCentralEclipse('H')).toBe(true);
      expect(isCentralEclipse('P')).toBe(false);
      expect(isCentralEclipse('N')).toBe(false);
    });

    it('isTotalEclipse 应正确判断', () => {
      expect(isTotalEclipse('T')).toBe(true);
      expect(isTotalEclipse('T0')).toBe(true);
      expect(isTotalEclipse('T1')).toBe(true);
      expect(isTotalEclipse('H')).toBe(true);
      expect(isTotalEclipse('A')).toBe(false);
      expect(isTotalEclipse('P')).toBe(false);
    });

    it('isAnnularEclipse 应正确判断', () => {
      expect(isAnnularEclipse('A')).toBe(true);
      expect(isAnnularEclipse('A0')).toBe(true);
      expect(isAnnularEclipse('A1')).toBe(true);
      expect(isAnnularEclipse('H')).toBe(true);
      expect(isAnnularEclipse('T')).toBe(false);
      expect(isAnnularEclipse('P')).toBe(false);
    });
  });
});

describe('日食计算精度测试', () => {
  it('2024年4月8日日全食检测', () => {
    // NASA数据: 2024年4月8日 日全食
    const jd = gregorianToJD(2024, 4, 8) - J2000;
    const result = searchSolarEclipseFast(jd);

    // 应该检测到日食
    expect(result.type).not.toBe('N');

    // 朔的时间应在4月8日左右
    const newMoonJd = result.newMoonJd;
    const expectedJd = gregorianToJD(2024, 4, 8);

    // 允许1天误差
    expect(Math.abs(newMoonJd - expectedJd)).toBeLessThan(1);
  });

  it('2023年4月20日全环食检测', () => {
    // NASA数据: 2023年4月20日 全环食 (混合日食)
    const jd = gregorianToJD(2023, 4, 20) - J2000;
    const result = searchSolarEclipseFast(jd);

    // 应该检测到日食
    expect(result.type).not.toBe('N');
  });
});
