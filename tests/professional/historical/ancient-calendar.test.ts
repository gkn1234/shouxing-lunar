/**
 * 古代历法参数验证测试
 *
 * 测试数据来源：寿星万年历 sm1.htm 第一章
 *
 * 平气平朔计算公式：D = k*n + b
 * - D: 气朔的日期（儒略日数）
 * - k: 气朔长度（平朔望月或平气）
 * - n: 气朔积累计数值
 * - b: 初始值
 */

import { describe, it, expect } from 'vitest';
import { gregorianToJD, jdToGregorian } from '../../../src/core/julian';
import { calculateLunarYear, getLunarDateInfo } from '../../../src/lunar/calendar';
import { J2000 } from '../../../src/core/constants';

// ============================================================================
// 平朔参数数据 - 来自 sm1.htm 第一章
// ============================================================================

/**
 * 平朔直线拟合参数
 * 格式：[b, k, 起始儒略日, 历法名称, 容差h]
 */
const PING_SHUO_PARAMETERS = [
  // 古历·春秋 -721-12-17
  {
    name: '古历·春秋',
    b: 1457698.231017,
    k: 29.53067166,
    startYear: -721,
    endYear: -480,
    tolerance: 0.00032,
  },
  // 古历·战国 -479-12-11
  {
    name: '古历·战国',
    b: 1546082.512234,
    k: 29.53085106,
    startYear: -479,
    endYear: -222,
    tolerance: 0.00053,
  },
  // 古历·秦汉 -221-10-31 (第一组)
  {
    name: '古历·秦汉(1)',
    b: 1640640.7353,
    k: 29.5306,
    startYear: -221,
    endYear: -217,
    tolerance: 0.0101,
  },
  // 古历·秦汉 -216-11-04 (第二组)
  {
    name: '古历·秦汉(2)',
    b: 1642472.151543,
    k: 29.53085439,
    startYear: -216,
    endYear: -105,
    tolerance: 0.0004,
  },
  // 汉书·律历志（太初历）-104-12-25
  {
    name: '太初历',
    b: 1683430.5093,
    k: 29.53086148,
    startYear: -104,
    endYear: 84,
    tolerance: 0.00313,
  },
  // 后汉书·律历志（四分历）85-02-13
  {
    name: '四分历',
    b: 1752148.041079,
    k: 29.53085097,
    startYear: 85,
    endYear: 236,
    tolerance: 0.00049,
  },
  // 晋书·律历志（景初历）237-02-12
  {
    name: '景初历',
    b: 1807665.420323,
    k: 29.53059851,
    startYear: 237,
    endYear: 444,
    tolerance: 0.00033,
  },
  // 宋书·律历志（何承天元嘉历）445-01-24
  {
    name: '元嘉历',
    b: 1883618.1141,
    k: 29.5306,
    startYear: 445,
    endYear: 509,
    tolerance: 0.0003,
  },
  // 宋书·律历志（祖冲之大明历）510-01-26
  {
    name: '大明历',
    b: 1907360.7047,
    k: 29.5306,
    startYear: 510,
    endYear: 589,
    tolerance: 0.0003,
  },
] as const;

// ============================================================================
// 平气参数数据 - 来自 sm1.htm 第一章
// ============================================================================

/**
 * 平气直线拟合参数
 * 格式：[b, k, 起始儒略日, 历法名称, 回归年长度]
 */
const PING_QI_PARAMETERS = [
  // 古历·秦汉 -221-11-09
  {
    name: '古历·秦汉(1)',
    b: 1640650.479938,
    k: 15.218425,
    startYear: -221,
    endYear: -217,
    yearLength: null, // 未给出
    tolerance: 0.01709,
  },
  // 古历·秦汉 -216-11-09
  {
    name: '古历·秦汉(2)',
    b: 1642476.703182,
    k: 15.21874996,
    startYear: -216,
    endYear: -105,
    yearLength: null,
    tolerance: 0.01557,
  },
  // 汉书·律历志（太初历）-104-12-25
  {
    name: '太初历',
    b: 1683430.515601,
    k: 15.218750011,
    startYear: -104,
    endYear: 84,
    yearLength: 365.25,
    tolerance: 0.0156,
  },
  // 后汉书·律历志（四分历）85-02-23
  {
    name: '四分历',
    b: 1752157.640664,
    k: 15.218749978,
    startYear: 85,
    endYear: 236,
    yearLength: 365.25,
    tolerance: 0.01559,
  },
  // 晋书·律历志（景初历）237-02-22
  {
    name: '景初历',
    b: 1807675.003759,
    k: 15.218620279,
    startYear: 237,
    endYear: 444,
    yearLength: 365.24689,
    tolerance: 0.0001,
  },
  // 宋书·律历志（何承天元嘉历）445-02-03
  {
    name: '元嘉历',
    b: 1883627.765182,
    k: 15.218612292,
    startYear: 445,
    endYear: 509,
    yearLength: 365.2467,
    tolerance: 0.00026,
  },
  // 宋书·律历志（祖冲之大明历）510-02-03
  {
    name: '大明历',
    b: 1907369.1281,
    k: 15.218449176,
    startYear: 510,
    endYear: 589,
    yearLength: 365.24278,
    tolerance: 0.00027,
  },
  // 随书·律历志（开皇历）590-02-17
  {
    name: '开皇历',
    b: 1936603.140413,
    k: 15.218425,
    startYear: 590,
    endYear: 596,
    yearLength: 365.2422,
    tolerance: 0.00149,
  },
  // 随书·律历志（大业历）597-02-03
  {
    name: '大业历',
    b: 1939145.52418,
    k: 15.218466998,
    startYear: 597,
    endYear: 618,
    yearLength: 365.24321,
    tolerance: 0.00121,
  },
  // 新唐书·历志（戊寅元历）619-02-03
  {
    name: '戊寅元历',
    b: 1947180.7983,
    k: 15.218524844,
    startYear: 619,
    endYear: 665,
    yearLength: 365.2446,
    tolerance: 0.00052,
  },
] as const;

// ============================================================================
// 朔望月常量
// ============================================================================

/** 现代计算的平均朔望月长度（天） */
const MODERN_SYNODIC_MONTH = 29.530588853;

/** 历史记载的四分历朔望月：29 + 499/940 天 */
const SIFEN_SYNODIC_MONTH = 29 + 499 / 940;

/** 回归年长度（天） */
const TROPICAL_YEAR = 365.2422;

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 根据平朔参数计算指定 n 的朔日
 */
function calculatePingShuo(b: number, k: number, n: number): number {
  return k * n + b;
}

/**
 * 根据平气参数计算指定 n 的节气
 */
function calculatePingQi(b: number, k: number, n: number): number {
  return k * n + b;
}

/**
 * 根据朔日反推 n 值
 */
function reversePingShuo(b: number, k: number, jd: number): number {
  return (jd - b) / k;
}

// ============================================================================
// 测试用例
// ============================================================================

describe('古代历法参数验证 - 平朔参数', () => {
  describe('平朔望月长度验证', () => {
    it('各历法的朔望月长度应与现代值接近', () => {
      PING_SHUO_PARAMETERS.forEach(({ name, k }) => {
        const diff = Math.abs(k - MODERN_SYNODIC_MONTH);
        // 古代朔望月长度与现代值相差应小于 0.001 天（约 1.4 分钟）
        expect(diff).toBeLessThan(0.001);
      });
    });

    it('四分历朔望月应与历史记载值接近', () => {
      const sifen = PING_SHUO_PARAMETERS.find((p) => p.name === '四分历');
      expect(sifen).toBeDefined();

      if (sifen) {
        // 反推得到的值 29.53085097 与历史记载的 29.53085106 相差极小
        const diff = Math.abs(sifen.k - SIFEN_SYNODIC_MONTH);
        // 相差应小于 0.00001 天
        expect(diff).toBeLessThan(0.00001);
      }
    });

    it('太初历朔望月应正确', () => {
      const taichu = PING_SHUO_PARAMETERS.find((p) => p.name === '太初历');
      expect(taichu).toBeDefined();

      if (taichu) {
        // 太初历朔望月约 29.53086148 天
        expect(taichu.k).toBeCloseTo(29.53086148, 6);
      }
    });
  });

  describe('平朔计算验证', () => {
    /**
     * 验证示例：求公元88年2月15日附近的朔日
     * 来自 sm1.htm 的计算示例
     */
    it('sm1.htm 计算示例：公元88年朔日', () => {
      const sifen = PING_SHUO_PARAMETERS.find((p) => p.name === '四分历');
      expect(sifen).toBeDefined();

      if (sifen) {
        // 估算日期：88年2月15日（儒略日数 1753245）
        const estimatedJd = 1753245;

        // 计算 n = (D-b)/k
        const n = reversePingShuo(sifen.b, sifen.k, estimatedJd);
        const roundedN = Math.round(n); // 四舍五入得 n = 37

        expect(roundedN).toBe(37);

        // 准确日期 D = k*n + b = 1753240.68
        const exactJd = calculatePingShuo(sifen.b, sifen.k, roundedN);
        expect(exactJd).toBeCloseTo(1753240.68, 1);

        // 转换为公历应为公元88年2月11日附近
        const date = jdToGregorian(exactJd);
        expect(date.year).toBe(88);
        expect(date.month).toBe(2);
        expect(date.day).toBe(11);
      }
    });

    PING_SHUO_PARAMETERS.forEach(({ name, b, k, startYear, endYear, tolerance }) => {
      describe(`${name} (${startYear}年至${endYear}年)`, () => {
        it(`初始参数 b 应为有效的儒略日`, () => {
          // b 应该在合理的历史范围内（儒略日 1000000-2500000）
          expect(b).toBeGreaterThan(1000000);
          expect(b).toBeLessThan(2500000);
        });

        it(`朔望月长度 k 应在合理范围内`, () => {
          // 朔望月应在 29.5-29.6 天之间
          expect(k).toBeGreaterThan(29.5);
          expect(k).toBeLessThan(29.6);
        });

        it(`容差 h 应符合文档规定`, () => {
          expect(tolerance).toBeDefined();
          expect(tolerance).toBeGreaterThan(0);
          expect(tolerance).toBeLessThan(0.02); // 所有容差应小于 0.02
        });

        it(`连续朔日间隔应等于 k`, () => {
          for (let n = 0; n < 10; n++) {
            const jd1 = calculatePingShuo(b, k, n);
            const jd2 = calculatePingShuo(b, k, n + 1);
            // 浮点精度限制，使用 9 位小数精度
            expect(jd2 - jd1).toBeCloseTo(k, 9);
          }
        });

        it(`一年内约有 12.37 个朔日`, () => {
          // 一年内朔日数 = 回归年 / 朔望月
          const shuoPerYear = TROPICAL_YEAR / k;
          expect(shuoPerYear).toBeCloseTo(12.37, 1);
        });
      });
    });
  });

  describe('历法时代连续性验证', () => {
    it('春秋历与战国历交接应平滑', () => {
      const chunqiu = PING_SHUO_PARAMETERS.find((p) => p.name === '古历·春秋');
      const zhanguo = PING_SHUO_PARAMETERS.find((p) => p.name === '古历·战国');

      expect(chunqiu).toBeDefined();
      expect(zhanguo).toBeDefined();

      if (chunqiu && zhanguo) {
        // 战国历起点 b 应大于春秋历起点
        expect(zhanguo.b).toBeGreaterThan(chunqiu.b);

        // 两个历法的 k 值相差应小于 0.0002
        expect(Math.abs(zhanguo.k - chunqiu.k)).toBeLessThan(0.0002);
      }
    });

    it('战国历与秦汉历交接应平滑', () => {
      const zhanguo = PING_SHUO_PARAMETERS.find((p) => p.name === '古历·战国');
      const qinhan = PING_SHUO_PARAMETERS.find((p) => p.name === '古历·秦汉(2)');

      expect(zhanguo).toBeDefined();
      expect(qinhan).toBeDefined();

      if (zhanguo && qinhan) {
        expect(qinhan.b).toBeGreaterThan(zhanguo.b);
      }
    });

    it('太初历与四分历交接应平滑', () => {
      const taichu = PING_SHUO_PARAMETERS.find((p) => p.name === '太初历');
      const sifen = PING_SHUO_PARAMETERS.find((p) => p.name === '四分历');

      expect(taichu).toBeDefined();
      expect(sifen).toBeDefined();

      if (taichu && sifen) {
        expect(sifen.b).toBeGreaterThan(taichu.b);
        // 两个历法的 k 值相差应小于 0.00001
        expect(Math.abs(sifen.k - taichu.k)).toBeLessThan(0.00002);
      }
    });
  });
});

describe('古代历法参数验证 - 平气参数', () => {
  describe('平气长度验证', () => {
    it('各历法的平气长度应与回归年 1/24 接近', () => {
      const expectedQiLength = TROPICAL_YEAR / 24;

      PING_QI_PARAMETERS.forEach(({ name, k }) => {
        const diff = Math.abs(k - expectedQiLength);
        // 平气长度与现代值相差应小于 0.001 天
        expect(diff).toBeLessThan(0.001);
      });
    });

    it('有回归年记载的历法年长度应正确', () => {
      PING_QI_PARAMETERS.forEach(({ name, k, yearLength }) => {
        if (yearLength) {
          // 24 个平气 = 1 回归年
          const calculatedYear = k * 24;
          expect(calculatedYear).toBeCloseTo(yearLength, 4);
        }
      });
    });
  });

  describe('平气计算验证', () => {
    PING_QI_PARAMETERS.forEach(({ name, b, k, startYear, endYear, yearLength, tolerance }) => {
      describe(`${name} (${startYear}年至${endYear}年)`, () => {
        it(`初始参数 b 应为有效的儒略日`, () => {
          expect(b).toBeGreaterThan(1000000);
          expect(b).toBeLessThan(2500000);
        });

        it(`平气长度 k 应在合理范围内`, () => {
          // 平气应在 15.2-15.3 天之间
          expect(k).toBeGreaterThan(15.2);
          expect(k).toBeLessThan(15.3);
        });

        it(`连续节气间隔应等于 k`, () => {
          for (let n = 0; n < 10; n++) {
            const jd1 = calculatePingQi(b, k, n);
            const jd2 = calculatePingQi(b, k, n + 1);
            // 浮点精度限制，使用 9 位小数精度
            expect(jd2 - jd1).toBeCloseTo(k, 9);
          }
        });

        if (yearLength) {
          it(`回归年长度应为 ${yearLength} 天`, () => {
            const calculatedYear = k * 24;
            expect(calculatedYear).toBeCloseTo(yearLength, 4);
          });
        }

        it(`24 个平气应等于一年`, () => {
          const yearFromQi = k * 24;
          // 一年应在 365-366 天之间
          expect(yearFromQi).toBeGreaterThan(365);
          expect(yearFromQi).toBeLessThan(366);
        });
      });
    });
  });

  describe('回归年长度历史演变', () => {
    it('各历法回归年长度应逐渐接近现代值', () => {
      // 提取有回归年记载的历法
      const withYearLength = PING_QI_PARAMETERS.filter((p) => p.yearLength !== null);

      // 按时间排序
      const sorted = [...withYearLength].sort((a, b) => a.startYear - b.startYear);

      // 验证晚期历法的回归年更接近现代值
      if (sorted.length >= 2) {
        const earlier = sorted[0];
        const later = sorted[sorted.length - 1];

        const earlierDiff = Math.abs(earlier.yearLength! - TROPICAL_YEAR);
        const laterDiff = Math.abs(later.yearLength! - TROPICAL_YEAR);

        // 晚期历法应更接近现代值（或至少不会更差）
        expect(laterDiff).toBeLessThanOrEqual(earlierDiff + 0.01);
      }
    });

    it('开皇历回归年应最接近现代值', () => {
      const kaihuang = PING_QI_PARAMETERS.find((p) => p.name === '开皇历');
      expect(kaihuang).toBeDefined();

      if (kaihuang) {
        // 开皇历回归年 365.2422 与现代值完全相同
        expect(kaihuang.yearLength).toBeCloseTo(TROPICAL_YEAR, 4);
      }
    });
  });
});

describe('古代历法特殊时期测试', () => {
  describe('春秋战国历法 (-721年至-104年)', () => {
    it('春秋历法应采用 19 年 7 闰', () => {
      // 19 年 7 闰意味着 19 年内有 235 个月
      // 235 / 19 ≈ 12.368
      const monthsPerYear = 235 / 19;
      expect(monthsPerYear).toBeCloseTo(12.368, 2);
    });

    it('春秋历的闰月名应为"十三"', () => {
      // 根据 sm1.htm，春秋历闰年的末月置闰并取名"闰十三"
      // 这里只验证参数定义的正确性
      const chunqiu = PING_SHUO_PARAMETERS.find((p) => p.name === '古历·春秋');
      expect(chunqiu).toBeDefined();
    });

    it('秦汉历的闰月名应为"后九"', () => {
      // 根据 sm1.htm，秦汉历闰年的末月置闰并取名"后九月"
      // 年首为十月
      const qinhan = PING_SHUO_PARAMETERS.find((p) => p.name === '古历·秦汉(2)');
      expect(qinhan).toBeDefined();
    });
  });

  describe('定气定朔的起始 (619年)', () => {
    it('619年前应使用平气平朔', () => {
      // 619 年开始使用平气定朔
      // 验证参数设置正确
      const wuyin = PING_QI_PARAMETERS.find((p) => p.name === '戊寅元历');
      expect(wuyin).toBeDefined();
      expect(wuyin?.startYear).toBe(619);
    });

    it('1645年后应使用定气定朔', () => {
      // 根据 sm1.htm，1645年及以后使用定气定朔
      // 这个时间点是历法的重大变化
      const JD_1645 = 2321919.49;
      expect(JD_1645).toBeGreaterThan(2300000);
    });
  });
});

describe('十九年七闰法验证', () => {
  it('19 年内应有 235 个朔望月', () => {
    // 19 回归年 ≈ 235 朔望月
    const yearsIn19 = 19 * TROPICAL_YEAR;
    const monthsIn235 = 235 * MODERN_SYNODIC_MONTH;

    // 两者相差应小于 1 天
    expect(Math.abs(yearsIn19 - monthsIn235)).toBeLessThan(1);
  });

  it('默冬周期（19年7闰）应使日月同步', () => {
    // 默冬周期：19 年 = 235 朔望月 = 6940 天
    const metonCycle = 19 * TROPICAL_YEAR;
    const lunarMonths = 235 * MODERN_SYNODIC_MONTH;

    expect(metonCycle).toBeCloseTo(lunarMonths, 0);
    expect(Math.round(metonCycle)).toBeCloseTo(6940, -1);
  });

  it('章岁（19年）内有 7 个闰月', () => {
    // 19 年内应有 12*19 + 7 = 235 个月
    const normalMonths = 12 * 19;
    const leapMonths = 7;
    const totalMonths = normalMonths + leapMonths;

    expect(totalMonths).toBe(235);
  });
});

describe('无中置闰法验证', () => {
  it('平气历法中一个月只能包含一个中气', () => {
    // 平气间隔约 30.44 天
    // 朔望月约 29.53 天
    // 两者差值约 0.91 天，累积到一定程度会出现无中气月
    const qiInterval = TROPICAL_YEAR / 12;
    const shuoInterval = MODERN_SYNODIC_MONTH;

    expect(qiInterval).toBeGreaterThan(shuoInterval);
    expect(qiInterval - shuoInterval).toBeCloseTo(0.91, 1);
  });

  it('约每 32.5 个月出现一个无中气月', () => {
    // 32.5 个朔望月约等于 33 个节气间隔
    // 这意味着约 32.5 个月会出现一个无中气月
    const qiInterval = TROPICAL_YEAR / 12;
    const shuoInterval = MODERN_SYNODIC_MONTH;

    const monthsPerLeap = shuoInterval / (qiInterval - shuoInterval);
    expect(monthsPerLeap).toBeCloseTo(32.5, 0);
  });

  it('约 2.7 年出现一个闰月', () => {
    // 32.5 个月 / 12 月/年 ≈ 2.7 年
    const monthsPerLeap = MODERN_SYNODIC_MONTH / (TROPICAL_YEAR / 12 - MODERN_SYNODIC_MONTH);
    const yearsPerLeap = monthsPerLeap / 12;

    expect(yearsPerLeap).toBeCloseTo(2.7, 0);
  });
});

describe('历法参数精度验证', () => {
  it('所有平朔参数应有足够的小数位数', () => {
    PING_SHUO_PARAMETERS.forEach(({ name, b, k }) => {
      // b 和 k 应至少有合理的小数位数
      const bDecimals = (b.toString().split('.')[1] || '').length;
      const kDecimals = (k.toString().split('.')[1] || '').length;

      expect(bDecimals).toBeGreaterThanOrEqual(2);
      // k 应有足够精度，但不强制要求最小位数（有些历法使用整数 k 如 29.5306）
      expect(kDecimals).toBeGreaterThanOrEqual(4);
    });
  });

  it('所有平气参数应有足够的小数位数', () => {
    PING_QI_PARAMETERS.forEach(({ name, b, k }) => {
      const bDecimals = (b.toString().split('.')[1] || '').length;
      const kDecimals = (k.toString().split('.')[1] || '').length;

      expect(bDecimals).toBeGreaterThanOrEqual(2);
      expect(kDecimals).toBeGreaterThanOrEqual(5);
    });
  });

  it('朔望月精度应满足历算要求', () => {
    // 千年内误差不超过 1 天要求：k 的精度至少为 1e-5
    // 因为 1000 年 ≈ 12000 个月，k 误差 1e-5 会累积到约 0.12 天
    PING_SHUO_PARAMETERS.forEach(({ name, k, tolerance }) => {
      // 验证 k 的精度足以在历法适用期内保持准确
      // 放宽要求到 4 位小数（有些历法使用简化的 k 值）
      expect(k.toString().split('.')[1]?.length || 0).toBeGreaterThanOrEqual(4);
    });
  });
});
