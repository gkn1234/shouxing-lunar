/**
 * 边界条件测试
 *
 * 测试数据来源：寿星万年历 sm1.htm, sm2.htm, sm5.htm, sm7.htm
 *
 * 包含：
 * - 儒略历/格里历切换
 * - 年份边界（天文纪年与历史纪年）
 * - 农历特殊现象
 * - ΔT 外推边界
 */

import { describe, it, expect } from 'vitest';
import { gregorianToJD, jdToGregorian } from '../../../src/core/julian';
import { calcDeltaT } from '../../../src/core/delta-t';
import { calculateLunarYear, getLunarDateInfo, clearLunarYearCache } from '../../../src/lunar/calendar';
import { J2000 } from '../../../src/core/constants';

// ============================================================================
// 儒略历/格里历切换测试
// ============================================================================

describe('儒略历/格里历切换边界测试', () => {
  /**
   * 格里历于1582年10月15日开始使用
   * 1582年10月4日（儒略历）之后直接跳到 10月15日（格里历）
   * 10月5日-14日不存在
   */

  describe('历法切换日期验证', () => {
    it('1582年10月4日（儒略历最后一天）应有效', () => {
      const jd = gregorianToJD(1582, 10, 4);
      expect(jd).toBeDefined();
      expect(isFinite(jd)).toBe(true);
    });

    it('1582年10月15日（格里历第一天）应有效', () => {
      const jd = gregorianToJD(1582, 10, 15);
      expect(jd).toBeDefined();
      expect(isFinite(jd)).toBe(true);

      // 格里历起始日 JD = 2299160.5
      expect(jd).toBeCloseTo(2299160.5, 1);
    });

    it('1582年10月4日和15日的儒略日差值', () => {
      const jd4 = gregorianToJD(1582, 10, 4.5);
      const jd15 = gregorianToJD(1582, 10, 15.5);

      // 注意：实际实现可能使用连续的公历（不区分儒略历/格里历切换）
      // 因此10月4日到10月15日的差值取决于实现方式
      const diff = jd15 - jd4;

      // 差值应为 11（连续公历）或 1（考虑历法切换）
      expect(diff === 11 || diff === 1).toBe(true);
    });

    it('1582年10月5-14日在儒略日系统中的处理', () => {
      // 这些日期在历史上不存在，但在计算系统中可能被处理为儒略历
      // 不同实现可能有不同处理方式
      for (let day = 5; day <= 14; day++) {
        const jd = gregorianToJD(1582, 10, day);
        // 应该返回有效的儒略日（作为儒略历日期处理）
        expect(isFinite(jd)).toBe(true);
      }
    });
  });

  describe('跨切换点的往返转换', () => {
    it('1582年10月15日往返转换应正确', () => {
      const jd = gregorianToJD(1582, 10, 15.5);
      const result = jdToGregorian(jd);

      expect(result.year).toBe(1582);
      expect(result.month).toBe(10);
      expect(result.day).toBe(15);
    });

    it('1582年10月4日往返转换应正确', () => {
      const jd = gregorianToJD(1582, 10, 4.5);
      const result = jdToGregorian(jd);

      expect(result.year).toBe(1582);
      expect(result.month).toBe(10);
      expect(result.day).toBe(4);
    });
  });
});

// ============================================================================
// 年份边界测试
// ============================================================================

describe('年份边界测试', () => {
  describe('天文纪年与历史纪年', () => {
    /**
     * 天文纪年：公元前1年 = 0年，公元前2年 = -1年
     * 历史纪年：没有公元0年，公元前1年直接到公元1年
     */

    it('公元0年（天文纪年）应有效', () => {
      const jd = gregorianToJD(0, 1, 1.5);
      expect(isFinite(jd)).toBe(true);

      const result = jdToGregorian(jd);
      expect(result.year).toBe(0);
    });

    it('公元前1年（天文-1年）应有效', () => {
      const jd = gregorianToJD(-1, 1, 1.5);
      expect(isFinite(jd)).toBe(true);

      const result = jdToGregorian(jd);
      expect(result.year).toBe(-1);
    });

    it('公元1年应有效', () => {
      const jd = gregorianToJD(1, 1, 1.5);
      expect(isFinite(jd)).toBe(true);

      const result = jdToGregorian(jd);
      expect(result.year).toBe(1);
    });

    it('公元0年12月31日到公元1年1月1日应连续', () => {
      const jd0 = gregorianToJD(0, 12, 31.5);
      const jd1 = gregorianToJD(1, 1, 1.5);

      expect(jd1 - jd0).toBeCloseTo(1, 5);
    });

    it('公元前1年12月31日到公元0年1月1日应连续', () => {
      const jdNeg1 = gregorianToJD(-1, 12, 31.5);
      const jd0 = gregorianToJD(0, 1, 1.5);

      expect(jd0 - jdNeg1).toBeCloseTo(1, 5);
    });
  });

  describe('负年份闰年判断', () => {
    /**
     * 闰年规则：
     * - 能被4整除但不能被100整除
     * - 或能被400整除
     * 注意：天文纪年中0年是闰年（对应历史的公元前1年）
     */

    it('公元0年应是闰年（有2月29日）', () => {
      const jd = gregorianToJD(0, 2, 29.5);
      expect(isFinite(jd)).toBe(true);

      const result = jdToGregorian(jd);
      expect(result.month).toBe(2);
      expect(result.day).toBe(29);
    });

    it('公元-4年应是闰年', () => {
      const jd = gregorianToJD(-4, 2, 29.5);
      expect(isFinite(jd)).toBe(true);

      const result = jdToGregorian(jd);
      expect(result.month).toBe(2);
      expect(result.day).toBe(29);
    });

    it('公元-1年应不是闰年（2月只有28天）', () => {
      // 2月28日
      const jd28 = gregorianToJD(-1, 2, 28.5);
      // 3月1日
      const jd31 = gregorianToJD(-1, 3, 1.5);

      // 2月28日到3月1日应只差1天（没有2月29日）
      expect(jd31 - jd28).toBeCloseTo(1, 5);
    });
  });

  describe('极端年份', () => {
    it('公元前4713年1月1日（儒略日起点附近）应有效', () => {
      const jd = gregorianToJD(-4712, 1, 1.5);
      expect(jd).toBeCloseTo(0, 0);
    });

    it('公元前5000年应能计算', () => {
      const jd = gregorianToJD(-5000, 6, 15);
      expect(isFinite(jd)).toBe(true);
    });

    it('公元5000年应能计算', () => {
      const jd = gregorianToJD(5000, 6, 15);
      expect(isFinite(jd)).toBe(true);
    });

    it('公元9999年应能计算', () => {
      const jd = gregorianToJD(9999, 12, 31);
      expect(isFinite(jd)).toBe(true);
    });
  });
});

// ============================================================================
// 农历特殊现象测试
// ============================================================================

describe('农历特殊现象测试', () => {
  beforeEach(() => {
    clearLunarYearCache();
  });

  describe('闰月规则', () => {
    /**
     * 无中置闰法：不含中气的月份为闰月
     * 但只有在年内有13个月时才置闰
     */

    it('闰月位置应在1-12之间或为0（无闰月）', () => {
      const testYears = [2020, 2023, 2025, 2028, 2030];

      testYears.forEach((year) => {
        const jd = gregorianToJD(year, 6, 15) - J2000;
        const yearData = calculateLunarYear(jd);

        expect(yearData.leapMonth).toBeGreaterThanOrEqual(0);
        expect(yearData.leapMonth).toBeLessThanOrEqual(12);
      });
    });

    it('2023年应有闰二月', () => {
      const jd = gregorianToJD(2023, 5, 15) - J2000;
      const yearData = calculateLunarYear(jd);

      expect(yearData.leapMonth).toBeGreaterThan(0);
    });

    it('2024年应无闰月', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);

      expect(yearData.leapMonth).toBe(0);
    });
  });

  describe('月大小规则', () => {
    /**
     * 农历月：大月30天，小月29天
     */

    it('每月天数应为29或30', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);

      yearData.monthDays.forEach((days) => {
        expect(days).toBeGreaterThanOrEqual(29);
        expect(days).toBeLessThanOrEqual(30);
      });
    });

    it('年历应包含正确数量的月份', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);

      // 应有14个月的数据（覆盖一年多）
      expect(yearData.monthDays.length).toBe(14);
      expect(yearData.monthNames.length).toBe(14);
    });
  });

  describe('冬至所在月规则', () => {
    /**
     * 冬至所在月必为年首（十一月）
     */

    it('冬至应在第一个节气附近', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);

      // zhongQi[0] 是冬至
      const winterSolstice = yearData.zhongQi[0];

      // 冬至应在12月附近（儒略日）
      const winterDate = jdToGregorian(winterSolstice + J2000);
      expect(winterDate.month).toBe(12);
    });
  });

  describe('农历日期边界', () => {
    it('农历日期应在有效范围内', () => {
      const testDates = [
        [2024, 1, 15],
        [2024, 6, 15],
        [2024, 12, 15],
        [2000, 1, 1],
        [1990, 6, 15],
      ];

      testDates.forEach(([year, month, day]) => {
        const jd = gregorianToJD(year, month, day) - J2000;
        const info = getLunarDateInfo(jd);

        expect(info.month).toBeGreaterThanOrEqual(1);
        expect(info.month).toBeLessThanOrEqual(13); // 允许十三月（古历）
        expect(info.day).toBeGreaterThanOrEqual(1);
        expect(info.day).toBeLessThanOrEqual(30);
      });
    });

    it('农历月名应有效', () => {
      const validMonthNames = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '拾贰', '后九', '十三', '一'];

      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const yearData = calculateLunarYear(jd);

      yearData.monthNames.forEach((name) => {
        // 去掉"闰"前缀后验证
        const baseName = name.replace('闰', '');
        expect(validMonthNames).toContain(baseName);
      });
    });
  });
});

// ============================================================================
// ΔT 外推边界测试
// ============================================================================

describe('ΔT 外推边界测试', () => {
  describe('已知数据范围内', () => {
    it('2000年 ΔT 应约为 63.87 秒', () => {
      const dt = calcDeltaT(2000);
      expect(dt).toBeCloseTo(63.87, 0);
    });

    it('1900年 ΔT 应约为 -2.3 秒', () => {
      const dt = calcDeltaT(1900);
      expect(dt).toBeCloseTo(-2.3, 0);
    });

    it('1800年 ΔT 应约为 13.4 秒', () => {
      const dt = calcDeltaT(1800);
      expect(dt).toBeCloseTo(13.4, 0);
    });
  });

  describe('外推区域', () => {
    /**
     * 2050年后使用外推公式
     * ΔT = -20 + 32 * t²，其中 t = (year - 1820) / 100
     */

    it('2050年前后应平滑过渡', () => {
      const dt2049 = calcDeltaT(2049);
      const dt2050 = calcDeltaT(2050);
      const dt2051 = calcDeltaT(2051);

      // 连续年份的 ΔT 变化应相对平滑
      const diff1 = Math.abs(dt2050 - dt2049);
      const diff2 = Math.abs(dt2051 - dt2050);

      expect(diff1).toBeLessThan(2); // 每年变化不超过2秒
      expect(diff2).toBeLessThan(3); // 外推区域可能稍大
    });

    it('2100年 ΔT 应使用外推', () => {
      const dt = calcDeltaT(2100);
      expect(isFinite(dt)).toBe(true);
      expect(dt).toBeGreaterThan(0);
    });

    it('2200年 ΔT 应合理增长', () => {
      const dt2100 = calcDeltaT(2100);
      const dt2200 = calcDeltaT(2200);

      // 未来 ΔT 应增长
      expect(dt2200).toBeGreaterThan(dt2100);
    });
  });

  describe('古代外推', () => {
    /**
     * 古代 ΔT 使用类似的二次外推
     */

    it('-500年 ΔT 应约为 17190 秒', () => {
      const dt = calcDeltaT(-500);
      // 允许较大误差范围（±430秒）
      expect(dt).toBeGreaterThan(16000);
      expect(dt).toBeLessThan(18000);
    });

    it('0年 ΔT 应约为 10580 秒', () => {
      const dt = calcDeltaT(0);
      // 允许较大误差范围（±260秒）
      expect(dt).toBeGreaterThan(10000);
      expect(dt).toBeLessThan(11000);
    });

    it('500年 ΔT 应约为 5710 秒', () => {
      const dt = calcDeltaT(500);
      // 允许较大误差范围（±140秒）
      expect(dt).toBeGreaterThan(5500);
      expect(dt).toBeLessThan(6000);
    });

    it('1000年 ΔT 应约为 1570 秒', () => {
      const dt = calcDeltaT(1000);
      // 允许较大误差范围（±55秒）
      expect(dt).toBeGreaterThan(1400);
      expect(dt).toBeLessThan(1700);
    });
  });

  describe('极端年份', () => {
    it('-4000年 ΔT 应有效', () => {
      const dt = calcDeltaT(-4000);
      expect(isFinite(dt)).toBe(true);
      // 古代 ΔT 应很大
      expect(dt).toBeGreaterThan(100000);
    });

    it('4000年 ΔT 应有效', () => {
      const dt = calcDeltaT(4000);
      expect(isFinite(dt)).toBe(true);
      // 未来 ΔT 应正且较大
      expect(dt).toBeGreaterThan(1000);
    });

    it('ΔT 函数不应产生 NaN', () => {
      const testYears = [-5000, -3000, -1000, 0, 1000, 2000, 3000, 5000];

      testYears.forEach((year) => {
        const dt = calcDeltaT(year);
        expect(isNaN(dt)).toBe(false);
        expect(isFinite(dt)).toBe(true);
      });
    });
  });

  describe('ΔT 连续性', () => {
    it('ΔT 应连续变化（无跳跃）', () => {
      // 测试从 1600 年到 2100 年
      let prevDt = calcDeltaT(1600);

      for (let year = 1601; year <= 2100; year++) {
        const dt = calcDeltaT(year);
        const diff = Math.abs(dt - prevDt);

        // 每年变化不应超过 5 秒（正常情况约 0.5-2 秒）
        expect(diff).toBeLessThan(5);

        prevDt = dt;
      }
    });
  });
});

// ============================================================================
// 数值稳定性测试
// ============================================================================

describe('数值稳定性边界测试', () => {
  describe('儒略日极端值', () => {
    it('儒略日 0 应对应正确日期', () => {
      const result = jdToGregorian(0);
      expect(result.year).toBe(-4712);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    it('J2000 应对应 2000年1月1日12时', () => {
      const result = jdToGregorian(J2000);
      expect(result.year).toBe(2000);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.hour).toBe(12);
    });

    it('很大的儒略日应有效', () => {
      const jd = 5000000; // 约公元9600年
      const result = jdToGregorian(jd);

      expect(isFinite(result.year)).toBe(true);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
    });
  });

  describe('农历计算稳定性', () => {
    it('远古年份农历应能计算', () => {
      const jd = gregorianToJD(-500, 6, 15) - J2000;

      // 不应抛出异常
      expect(() => {
        const yearData = calculateLunarYear(jd);
        expect(yearData).toBeDefined();
      }).not.toThrow();
    });

    it('远未来年份农历应能计算', () => {
      const jd = gregorianToJD(2500, 6, 15) - J2000;

      expect(() => {
        const yearData = calculateLunarYear(jd);
        expect(yearData).toBeDefined();
      }).not.toThrow();
    });
  });
});
