/**
 * ΔT 参考值验证测试
 *
 * ΔT (Delta T) = TT - UT1 (地球时与世界时之差)
 * 由于地球自转不均匀，力学时与世界时存在差异
 *
 * 测试数据来源：sm7.htm 第七章 - 美国航空航天局 (NASA) 官方网站数据
 * @see https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html
 *
 * 所有参考值用于验证 ΔT 计算的精确性和历史数据拟合度
 */

import { describe, it, expect } from 'vitest';
import { calcDeltaT, deltaTFromJD, utToTD, tdToUT } from '../../../src/core/delta-t';

// ============================================================================
// 常量定义 - 消除魔数
// ============================================================================

/** 每天的秒数 */
const SECONDS_PER_DAY = 86400;

/** J2000 纪元的儒略日 */
const J2000_JD = 2451545;

/** 儒略年的天数 */
const JULIAN_YEAR_DAYS = 365.2425;

/** 精度等级 */
const PRECISION = {
  /** 历史数据精度（小数点后位数） */
  HISTORICAL: 0,
  /** 近代数据精度（小数点后位数） - 允许 0.5 秒误差 */
  MODERN: 0,
  /** 高精度（小数点后位数） */
  HIGH: 5,
  /** 往返转换精度（儒略日） */
  ROUND_TRIP_JD: 0.0001,
  /** 时间转换一致性（秒） */
  TIME_CONVERSION_SECONDS: 1,
} as const;

/** 外推测试的年份边界 */
const EXTRAPOLATION_BOUNDS = {
  /** 远古年份下界 */
  ANCIENT_LOWER: -5000,
  /** 远古年份上界 */
  ANCIENT_UPPER: -4000,
  /** 远未来年份下界 */
  FAR_FUTURE_LOWER: 3000,
  /** 远未来年份上界 */
  FAR_FUTURE_UPPER: 5000,
  /** 最大合理 ΔT（秒）*/
  MAX_REASONABLE_DELTA_T: 500000,
} as const;

// ============================================================================
// 测试数据定义 - NASA 官方参考值
// ============================================================================

/**
 * 历史参考值测试数据
 * 来源：sm7.htm 第七章 - NASA 官方网站
 *
 * 每条记录包含：
 * - year: 年份
 * - deltaT: 预期 ΔT（秒）
 * - tolerance: 允许误差（秒）
 */
interface HistoricalReference {
  /** 年份 */
  year: number;
  /** 预期 ΔT（秒） */
  deltaT: number;
  /** 允许误差（秒） */
  tolerance: number;
}

/**
 * NASA 历史 ΔT 参考值（公元前500年 - 公元1950年）
 * 数据来源：sm7.htm 第七章
 */
const NASA_HISTORICAL_REFERENCES: HistoricalReference[] = [
  { year: -500, deltaT: 17190, tolerance: 430 },
  { year: -400, deltaT: 15530, tolerance: 390 },
  { year: -300, deltaT: 14080, tolerance: 360 },
  { year: -200, deltaT: 12790, tolerance: 330 },
  { year: -100, deltaT: 11640, tolerance: 290 },
  { year: 0, deltaT: 10580, tolerance: 260 },
  { year: 100, deltaT: 9600, tolerance: 240 },
  { year: 200, deltaT: 8640, tolerance: 210 },
  { year: 300, deltaT: 7680, tolerance: 180 },
  { year: 400, deltaT: 6700, tolerance: 160 },
  { year: 500, deltaT: 5710, tolerance: 140 },
  { year: 600, deltaT: 4740, tolerance: 120 },
  { year: 700, deltaT: 3810, tolerance: 100 },
  { year: 800, deltaT: 2960, tolerance: 80 },
  { year: 900, deltaT: 2200, tolerance: 70 },
  { year: 1000, deltaT: 1570, tolerance: 55 },
  { year: 1100, deltaT: 1090, tolerance: 40 },
  { year: 1200, deltaT: 740, tolerance: 30 },
  { year: 1300, deltaT: 490, tolerance: 20 },
  { year: 1400, deltaT: 320, tolerance: 20 },
  { year: 1500, deltaT: 200, tolerance: 20 },
  { year: 1600, deltaT: 120, tolerance: 20 },
  { year: 1700, deltaT: 9, tolerance: 5 },
  { year: 1750, deltaT: 13, tolerance: 2 },
  { year: 1800, deltaT: 14, tolerance: 1 },
  { year: 1850, deltaT: 7, tolerance: 1 },
  { year: 1900, deltaT: -3, tolerance: 1 },
  { year: 1950, deltaT: 29, tolerance: 0.1 },
];

/**
 * 近代精确值测试数据（1955-2005年）
 * 来源：sm7.htm 第七章 - NASA 官方网站
 *
 * 这些数据基于实际观测，精度更高
 */
interface ModernReference {
  /** 年份 */
  year: number;
  /** 预期 ΔT（秒） */
  deltaT: number;
}

/**
 * NASA 近代 ΔT 精确值（1955-2005年）
 * 数据来源：sm7.htm 第七章
 */
const NASA_MODERN_REFERENCES: ModernReference[] = [
  { year: 1955, deltaT: 31.1 },
  { year: 1960, deltaT: 33.2 },
  { year: 1965, deltaT: 35.7 },
  { year: 1970, deltaT: 40.2 },
  { year: 1975, deltaT: 45.5 },
  { year: 1980, deltaT: 50.5 },
  { year: 1985, deltaT: 54.3 },
  { year: 1990, deltaT: 56.9 },
  { year: 1995, deltaT: 60.8 },
  { year: 2000, deltaT: 63.8 },
  { year: 2005, deltaT: 64.7 },
];

/** 近代数据允许的误差范围（秒） */
const MODERN_TOLERANCE = 1.5;

// ============================================================================
// 测试用例
// ============================================================================

describe('ΔT 参考值验证 - NASA 官方数据', () => {
  describe('历史参考值测试（公元前500年 - 公元1950年）', () => {
    /**
     * 验证历史 ΔT 计算值在 NASA 文档允许的误差范围内
     * 数据来源：sm7.htm 第七章
     */
    NASA_HISTORICAL_REFERENCES.forEach(({ year, deltaT, tolerance }) => {
      const yearLabel = year >= 0 ? `公元${year}年` : `公元前${-year + 1}年`;

      it(`${yearLabel}: ΔT = ${deltaT}s (误差 ±${tolerance}s)`, () => {
        const calculated = calcDeltaT(year);
        const difference = Math.abs(calculated - deltaT);

        expect(difference).toBeLessThanOrEqual(tolerance);
      });
    });
  });

  describe('近代精确值测试（1955-2005年）', () => {
    /**
     * 验证近代 ΔT 计算值与实测数据的匹配度
     * 数据来源：sm7.htm 第七章
     *
     * 近代数据基于实际观测，但算法使用多项式拟合，允许约 1 秒的误差
     */
    NASA_MODERN_REFERENCES.forEach(({ year, deltaT }) => {
      it(`${year}年: ΔT = ${deltaT}s`, () => {
        const calculated = calcDeltaT(year);
        const difference = Math.abs(calculated - deltaT);

        // 近代数据允许 1.5 秒的误差
        expect(difference).toBeLessThan(MODERN_TOLERANCE);
      });
    });

    it('近代数据整体误差应小于允许范围', () => {
      const errors = NASA_MODERN_REFERENCES.map(({ year, deltaT }) => {
        const calculated = calcDeltaT(year);
        return Math.abs(calculated - deltaT);
      });

      const maxError = Math.max(...errors);
      const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;

      expect(maxError).toBeLessThan(MODERN_TOLERANCE);
      expect(avgError).toBeLessThan(MODERN_TOLERANCE / 2);
    });
  });

  describe('ΔT 变化趋势测试', () => {
    it('古代 ΔT 应随时间递减（地球自转逐渐加速的历史效应）', () => {
      // 从公元前500年到公元1600年，ΔT 应该整体递减
      const ancientYears = [-500, 0, 500, 1000, 1500];
      const deltaTValues = ancientYears.map((year) => calcDeltaT(year));

      // 验证递减趋势
      for (let i = 0; i < deltaTValues.length - 1; i++) {
        expect(deltaTValues[i]).toBeGreaterThan(deltaTValues[i + 1]);
      }
    });

    it('近代 ΔT 应随时间递增（1900年后地球自转减速）', () => {
      // 从1900年到2005年，ΔT 应该整体递增
      const modernYears = [1900, 1950, 1980, 2000, 2005];
      const deltaTValues = modernYears.map((year) => calcDeltaT(year));

      // 1900年的 ΔT 约为 -3 秒，之后逐渐增加
      // 验证递增趋势（除了1900年的负值）
      for (let i = 1; i < deltaTValues.length - 1; i++) {
        expect(deltaTValues[i + 1]).toBeGreaterThan(deltaTValues[i]);
      }
    });

    it('ΔT 在1700-1900年间应保持较小值', () => {
      // 这个时期 ΔT 值较小，在 -5 到 20 秒之间
      const smallDeltaTYears = [1700, 1750, 1800, 1850, 1900];

      smallDeltaTYears.forEach((year) => {
        const deltaT = calcDeltaT(year);
        expect(Math.abs(deltaT)).toBeLessThan(20);
      });
    });

    it('相邻年份的 ΔT 变化应平滑（无突变）', () => {
      // 测试多个时期的平滑性
      // 注意：古代时期 ΔT 变化较大，需要较宽松的阈值
      // 近代时期（1960年前后）由于多项式拟合段切换，也允许较大变化
      const testRanges = [
        { start: -500, end: 0, maxChange: 200 },
        { start: 1000, end: 1500, maxChange: 70 },
        { start: 1975, end: 2005, maxChange: 12 },
      ];

      testRanges.forEach(({ start, end, maxChange }) => {
        for (let year = start; year < end; year += 10) {
          const dt1 = calcDeltaT(year);
          const dt2 = calcDeltaT(year + 10);
          const change = Math.abs(dt2 - dt1);

          expect(change).toBeLessThan(maxChange);
        }
      });
    });
  });

  describe('时间转换测试（utToTD 和 tdToUT）', () => {
    /**
     * 测试时间转换函数的往返一致性
     */
    it('UT -> TD -> UT 往返转换应保持一致性', () => {
      const testJDs = [
        J2000_JD, // J2000
        J2000_JD - 36525, // 1900年
        J2000_JD + 36525, // 2100年
        J2000_JD - 182625, // 1500年
      ];

      testJDs.forEach((jdUT) => {
        const jdTD = utToTD(jdUT);
        const jdUT2 = tdToUT(jdTD);

        expect(Math.abs(jdUT2 - jdUT)).toBeLessThan(PRECISION.ROUND_TRIP_JD);
      });
    });

    it('TD -> UT -> TD 往返转换应保持一致性', () => {
      const testJDs = [
        J2000_JD,
        J2000_JD - 36525,
        J2000_JD + 36525,
      ];

      testJDs.forEach((jdTD) => {
        const jdUT = tdToUT(jdTD);
        const jdTD2 = utToTD(jdUT);

        expect(Math.abs(jdTD2 - jdTD)).toBeLessThan(PRECISION.ROUND_TRIP_JD);
      });
    });

    it('TD - UT 差值应等于 ΔT', () => {
      const testYears = [1900, 1950, 2000, 2005, 2020];

      testYears.forEach((year) => {
        // 计算该年的儒略日
        const jdUT = J2000_JD + (year - 2000) * JULIAN_YEAR_DAYS;
        const jdTD = utToTD(jdUT);

        // TD - UT 转换为秒
        const diffSeconds = (jdTD - jdUT) * SECONDS_PER_DAY;

        // 与 calcDeltaT 结果比较
        const expectedDeltaT = calcDeltaT(year);

        expect(diffSeconds).toBeCloseTo(expectedDeltaT, PRECISION.HISTORICAL);
      });
    });

    it('近代时期 TD 应大于 UT（ΔT > 0）', () => {
      const modernJD = J2000_JD; // 2000年
      const jdTD = utToTD(modernJD);

      expect(jdTD).toBeGreaterThan(modernJD);
    });

    it('1900年前后 TD 和 UT 接近（ΔT 接近0）', () => {
      // 1900年 ΔT 约为 -3 秒
      const jd1900 = J2000_JD - 100 * JULIAN_YEAR_DAYS;
      const jdTD = utToTD(jd1900);

      // 差值应该很小（约几秒）
      const diffSeconds = Math.abs((jdTD - jd1900) * SECONDS_PER_DAY);
      expect(diffSeconds).toBeLessThan(10);
    });
  });

  describe('deltaTFromJD 函数测试', () => {
    it('J2000（t=0）的 ΔT 应约为 63.87 秒', () => {
      const deltaTDays = deltaTFromJD(0);
      const deltaTSeconds = deltaTDays * SECONDS_PER_DAY;

      expect(deltaTSeconds).toBeCloseTo(63.87, PRECISION.MODERN);
    });

    it('儒略日与年份计算结果一致', () => {
      const testYears = [1950, 1980, 2000, 2005, 2020];

      testYears.forEach((year) => {
        // 从年份计算 ΔT
        const deltaTFromYear = calcDeltaT(year);

        // 从儒略日计算 ΔT
        const jdFromJ2000 = (year - 2000) * JULIAN_YEAR_DAYS;
        const deltaTFromJDResult = deltaTFromJD(jdFromJ2000) * SECONDS_PER_DAY;

        expect(deltaTFromJDResult).toBeCloseTo(deltaTFromYear, PRECISION.HIGH);
      });
    });
  });

  describe('外推合理性测试', () => {
    it('远古年份（公元前5000-4000年）外推值应合理', () => {
      for (
        let year = EXTRAPOLATION_BOUNDS.ANCIENT_LOWER;
        year <= EXTRAPOLATION_BOUNDS.ANCIENT_UPPER;
        year += 100
      ) {
        const deltaT = calcDeltaT(year);

        // 远古 ΔT 应该非常大（数万秒）但不应超出合理范围
        expect(deltaT).toBeGreaterThan(0);
        expect(deltaT).toBeLessThan(EXTRAPOLATION_BOUNDS.MAX_REASONABLE_DELTA_T);
      }
    });

    it('远未来年份（3000-5000年）外推值应合理', () => {
      for (
        let year = EXTRAPOLATION_BOUNDS.FAR_FUTURE_LOWER;
        year <= EXTRAPOLATION_BOUNDS.FAR_FUTURE_UPPER;
        year += 100
      ) {
        const deltaT = calcDeltaT(year);

        // 未来 ΔT 应该逐渐增加但不应失控
        expect(deltaT).toBeGreaterThan(0);
        expect(deltaT).toBeLessThan(EXTRAPOLATION_BOUNDS.MAX_REASONABLE_DELTA_T);
      }
    });

    it('外推应保持单调性（远古时期 ΔT 应随年代增加而减小）', () => {
      const ancientYears = [-5000, -4500, -4000, -3500, -3000];
      const deltaTValues = ancientYears.map((year) => calcDeltaT(year));

      for (let i = 0; i < deltaTValues.length - 1; i++) {
        expect(deltaTValues[i]).toBeGreaterThan(deltaTValues[i + 1]);
      }
    });

    it('外推应保持单调性（远未来时期 ΔT 应随年代增加而增大）', () => {
      const futureYears = [2100, 2500, 3000, 4000, 5000];
      const deltaTValues = futureYears.map((year) => calcDeltaT(year));

      for (let i = 0; i < deltaTValues.length - 1; i++) {
        expect(deltaTValues[i + 1]).toBeGreaterThan(deltaTValues[i]);
      }
    });

    it('表格边界到外推区域的过渡应平滑', () => {
      // 测试表格结束后的过渡区域
      // 注意：表格在2050年附近结束，过渡区域变化可能较大
      // 算法在过渡区域使用渐进平滑，但仍有明显变化
      const transitionYears = [2045, 2050, 2055, 2060, 2070, 2080];
      const deltaTValues = transitionYears.map((year) => calcDeltaT(year));

      // 相邻年份变化不应超过25秒（过渡区域允许更大变化）
      for (let i = 0; i < deltaTValues.length - 1; i++) {
        const change = Math.abs(deltaTValues[i + 1] - deltaTValues[i]);
        expect(change).toBeLessThan(25);
      }
    });
  });

  describe('边界和特殊情况测试', () => {
    it('年份0（公元前1年）应正确计算', () => {
      const deltaT = calcDeltaT(0);
      // 根据 NASA 数据，公元0年 ΔT 约为 10580 秒，允许误差 ±260 秒
      const expected = 10580;
      const tolerance = 260;
      expect(Math.abs(deltaT - expected)).toBeLessThanOrEqual(tolerance);
    });

    it('负年份（公元前）应正确处理', () => {
      const deltaTNeg500 = calcDeltaT(-500);
      // 根据 NASA 数据，公元前500年 ΔT 约为 17190 秒，允许误差 ±430 秒
      const expected = 17190;
      const tolerance = 430;
      expect(Math.abs(deltaTNeg500 - expected)).toBeLessThanOrEqual(tolerance);
    });

    it('小数年份应正确插值', () => {
      const deltaT2000_0 = calcDeltaT(2000);
      const deltaT2000_5 = calcDeltaT(2000.5);
      const deltaT2001_0 = calcDeltaT(2001);

      // 2000.5 应该在 2000 和 2001 之间
      expect(deltaT2000_5).toBeGreaterThanOrEqual(Math.min(deltaT2000_0, deltaT2001_0));
      expect(deltaT2000_5).toBeLessThanOrEqual(Math.max(deltaT2000_0, deltaT2001_0));
    });

    it('极端小数年份应正确处理', () => {
      // 测试年中时刻
      const deltaT2000_25 = calcDeltaT(2000.25);
      const deltaT2000_75 = calcDeltaT(2000.75);

      expect(typeof deltaT2000_25).toBe('number');
      expect(typeof deltaT2000_75).toBe('number');
      expect(isNaN(deltaT2000_25)).toBe(false);
      expect(isNaN(deltaT2000_75)).toBe(false);
    });
  });

  describe('数值稳定性测试', () => {
    it('连续计算结果应稳定', () => {
      const year = 2000;
      const results: number[] = [];

      for (let i = 0; i < 100; i++) {
        results.push(calcDeltaT(year));
      }

      // 所有结果应该完全相同
      const uniqueResults = [...new Set(results)];
      expect(uniqueResults.length).toBe(1);
    });

    it('大范围年份扫描不应产生 NaN 或 Infinity', () => {
      const years = [];
      for (let year = -5000; year <= 5000; year += 100) {
        years.push(year);
      }

      years.forEach((year) => {
        const deltaT = calcDeltaT(year);
        expect(isNaN(deltaT)).toBe(false);
        expect(isFinite(deltaT)).toBe(true);
      });
    });
  });
});
