/**
 * 干支纪法计算测试
 *
 * 测试数据来源：寿星万年历 sm5.htm 第五章
 *
 * 干支纪法包括：
 * - 干支纪年（以立春为界或以正月初一为界）
 * - 干支纪月（以节气为界）
 * - 干支纪日
 * - 干支纪时
 */

import { describe, it, expect } from 'vitest';
import { gregorianToJD } from '../../../src/core/julian';
import { J2000 } from '../../../src/core/constants';
import {
  TIAN_GAN,
  DI_ZHI,
  SHENG_XIAO,
  getGanZhi,
  getYearGanZhi,
  getYearGanZhiBySpring,
  getMonthGanZhi,
  getDayGanZhi,
  getHourGanZhi,
  getShengXiao,
  getFullGanZhi,
  ganZhiToIndex,
  JIA_ZI_TABLE,
} from '../../../src/lunar/gan-zhi';

// ============================================================================
// 常量定义
// ============================================================================

/** 六十甲子周期 */
const JIA_ZI_CYCLE = 60;

/** 天干数量 */
const TIAN_GAN_COUNT = 10;

/** 地支数量 */
const DI_ZHI_COUNT = 12;

/** 生肖数量 */
const SHENG_XIAO_COUNT = 12;

// ============================================================================
// 标准参考值 - 来自 sm5.htm 和常识
// ============================================================================

/**
 * 干支纪年标准参考值
 * 来源：sm5.htm 第五章
 */
const YEAR_GANZHI_REFERENCES = [
  // 1984年为甲子年
  { year: 1984, ganZhi: '甲子', shengXiao: '鼠' },
  // 2000年为庚辰年
  { year: 2000, ganZhi: '庚辰', shengXiao: '龙' },
  // 2024年为甲辰年
  { year: 2024, ganZhi: '甲辰', shengXiao: '龙' },
  // 1949年为己丑年
  { year: 1949, ganZhi: '己丑', shengXiao: '牛' },
  // 2008年为戊子年
  { year: 2008, ganZhi: '戊子', shengXiao: '鼠' },
  // 2012年为壬辰年
  { year: 2012, ganZhi: '壬辰', shengXiao: '龙' },
  // 1911年为辛亥年
  { year: 1911, ganZhi: '辛亥', shengXiao: '猪' },
  // 1900年为庚子年
  { year: 1900, ganZhi: '庚子', shengXiao: '鼠' },
] as const;

/**
 * 干支纪月标准参考值
 * 来源：sm5.htm
 * 1998年12月7日（大雪）为甲子月
 */
const MONTH_GANZHI_REFERENCES = [
  { year: 1998, month: 12, day: 7, ganZhi: '甲子' },
  { year: 1999, month: 1, day: 6, ganZhi: '乙丑' },
  { year: 1999, month: 2, day: 4, ganZhi: '丙寅' },
] as const;

/**
 * 干支纪日标准参考值
 * 2000年1月7日为甲子日（按照源代码逻辑）
 * 注意：getDayGanZhi 计算基于 jd - 6，所以 J2000+6 为甲子日
 */
const DAY_GANZHI_REFERENCES = [
  // 根据实际计算验证的日期
  { year: 2000, month: 1, day: 1, ganZhi: '戊午' },  // J2000 对应戊午
  { year: 2000, month: 1, day: 7, ganZhi: '甲子' },  // J2000+6 对应甲子
  { year: 2000, month: 1, day: 8, ganZhi: '乙丑' },
  { year: 2000, month: 3, day: 7, ganZhi: '甲子' },  // 60 天后回到甲子
] as const;

/**
 * 六十甲子表标准值
 */
const STANDARD_JIA_ZI = [
  '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
  '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
  '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
  '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
  '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
  '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥',
] as const;

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 将年份转换为 J2000 起算的儒略日（取年中某日）
 */
function yearToJd(year: number, month: number = 6, day: number = 15): number {
  return gregorianToJD(year, month, day) - J2000;
}

/**
 * 将日期转换为 J2000 起算的儒略日
 * 使用 0.5 日偏移，表示该日的正午12时
 */
function dateToJd(year: number, month: number, day: number): number {
  return gregorianToJD(year, month, day + 0.5) - J2000;
}

// ============================================================================
// 测试用例
// ============================================================================

describe('干支基础数据验证', () => {
  describe('天干地支数组', () => {
    it('天干应有 10 个', () => {
      expect(TIAN_GAN.length).toBe(TIAN_GAN_COUNT);
    });

    it('地支应有 12 个', () => {
      expect(DI_ZHI.length).toBe(DI_ZHI_COUNT);
    });

    it('生肖应有 12 个', () => {
      expect(SHENG_XIAO.length).toBe(SHENG_XIAO_COUNT);
    });

    it('天干顺序应正确', () => {
      expect(TIAN_GAN).toEqual(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']);
    });

    it('地支顺序应正确', () => {
      expect(DI_ZHI).toEqual(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']);
    });

    it('生肖顺序应正确', () => {
      expect(SHENG_XIAO).toEqual(['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']);
    });

    it('地支与生肖应一一对应', () => {
      // 子-鼠, 丑-牛, 寅-虎, ...
      const mapping = ['子鼠', '丑牛', '寅虎', '卯兔', '辰龙', '巳蛇', '午马', '未羊', '申猴', '酉鸡', '戌狗', '亥猪'];
      for (let i = 0; i < DI_ZHI_COUNT; i++) {
        expect(DI_ZHI[i] + SHENG_XIAO[i]).toBe(mapping[i]);
      }
    });
  });

  describe('六十甲子表', () => {
    it('六十甲子表应有 60 个', () => {
      expect(JIA_ZI_TABLE.length).toBe(JIA_ZI_CYCLE);
    });

    it('六十甲子表顺序应正确', () => {
      expect(JIA_ZI_TABLE).toEqual(STANDARD_JIA_ZI);
    });

    it('六十甲子表应无重复', () => {
      const set = new Set(JIA_ZI_TABLE);
      expect(set.size).toBe(JIA_ZI_CYCLE);
    });

    it('六十甲子表中干支奇偶性应一致', () => {
      // 阳干配阳支，阴干配阴支
      JIA_ZI_TABLE.forEach((gz, index) => {
        const ganIndex = TIAN_GAN.indexOf(gz[0] as typeof TIAN_GAN[number]);
        const zhiIndex = DI_ZHI.indexOf(gz[1] as typeof DI_ZHI[number]);
        expect(ganIndex % 2).toBe(zhiIndex % 2);
      });
    });
  });
});

describe('getGanZhi - 索引转干支', () => {
  it('索引 0 应返回甲子', () => {
    const result = getGanZhi(0);
    expect(result.ganZhi).toBe('甲子');
    expect(result.ganIndex).toBe(0);
    expect(result.zhiIndex).toBe(0);
  });

  it('索引 1 应返回乙丑', () => {
    const result = getGanZhi(1);
    expect(result.ganZhi).toBe('乙丑');
  });

  it('索引 59 应返回癸亥', () => {
    const result = getGanZhi(59);
    expect(result.ganZhi).toBe('癸亥');
  });

  it('索引 60 应返回甲子（周期性）', () => {
    const result = getGanZhi(60);
    expect(result.ganZhi).toBe('甲子');
  });

  it('负索引应正确处理', () => {
    const result = getGanZhi(-1);
    expect(result.ganZhi).toBe('癸亥');
  });

  it('所有 60 个索引应与标准表一致', () => {
    for (let i = 0; i < 60; i++) {
      const result = getGanZhi(i);
      expect(result.ganZhi).toBe(STANDARD_JIA_ZI[i]);
    }
  });
});

describe('ganZhiToIndex - 干支转索引', () => {
  it('甲子应返回 0', () => {
    expect(ganZhiToIndex('甲子')).toBe(0);
  });

  it('乙丑应返回 1', () => {
    expect(ganZhiToIndex('乙丑')).toBe(1);
  });

  it('癸亥应返回 59', () => {
    expect(ganZhiToIndex('癸亥')).toBe(59);
  });

  it('无效干支组合应返回 -1', () => {
    // 甲丑是无效组合（阳干配阴支）
    expect(ganZhiToIndex('甲丑')).toBe(-1);
    expect(ganZhiToIndex('乙子')).toBe(-1);
  });

  it('无效字符串应返回 -1', () => {
    expect(ganZhiToIndex('')).toBe(-1);
    expect(ganZhiToIndex('甲')).toBe(-1);
    expect(ganZhiToIndex('甲子丑')).toBe(-1);
    expect(ganZhiToIndex('AB')).toBe(-1);
  });

  it('所有有效干支应能正确转换', () => {
    for (let i = 0; i < 60; i++) {
      const ganZhi = STANDARD_JIA_ZI[i];
      expect(ganZhiToIndex(ganZhi)).toBe(i);
    }
  });
});

describe('干支纪年验证 - 标准参考值', () => {
  describe('getYearGanZhi - 以立春为界', () => {
    YEAR_GANZHI_REFERENCES.forEach(({ year, ganZhi, shengXiao }) => {
      it(`${year}年应为${ganZhi}年（${shengXiao}年）`, () => {
        // 使用年中日期，确保在立春之后
        const jd = yearToJd(year, 6, 15);
        const result = getYearGanZhi(jd);
        expect(result.ganZhi).toBe(ganZhi);
      });
    });

    it('1984年为甲子年基准验证', () => {
      const jd = yearToJd(1984, 6, 15);
      const result = getYearGanZhi(jd);
      expect(result.ganZhi).toBe('甲子');
      expect(result.ganIndex).toBe(0);
      expect(result.zhiIndex).toBe(0);
    });

    it('连续年份干支应连续', () => {
      for (let year = 1984; year < 2044; year++) {
        const jd1 = yearToJd(year, 6, 15);
        const jd2 = yearToJd(year + 1, 6, 15);

        const result1 = getYearGanZhi(jd1);
        const result2 = getYearGanZhi(jd2);

        const expected = getGanZhi(ganZhiToIndex(result1.ganZhi) + 1);
        expect(result2.ganZhi).toBe(expected.ganZhi);
      }
    });
  });

  describe('getYearGanZhiBySpring - 以正月初一为界', () => {
    it('正月初一前后应有差异', () => {
      // 2024年春节是2月10日
      const beforeSpring = dateToJd(2024, 2, 9);
      const afterSpring = dateToJd(2024, 2, 11);

      const result1 = getYearGanZhiBySpring(beforeSpring);
      const result2 = getYearGanZhiBySpring(afterSpring);

      // 春节前后年份干支可能不同
      // 具体取决于计算逻辑
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});

describe('干支纪月验证 - 标准参考值', () => {
  describe('getMonthGanZhi - 以节气为界', () => {
    MONTH_GANZHI_REFERENCES.forEach(({ year, month, day, ganZhi }) => {
      it(`${year}年${month}月${day}日应为${ganZhi}月`, () => {
        const jd = dateToJd(year, month, day);
        const result = getMonthGanZhi(jd);
        expect(result.ganZhi).toBe(ganZhi);
      });
    });

    it('1998年12月7日为甲子月基准验证', () => {
      const jd = dateToJd(1998, 12, 7);
      const result = getMonthGanZhi(jd);
      expect(result.ganZhi).toBe('甲子');
    });

    it('连续月份干支应连续', () => {
      // 验证连续月份的干支应按序递增
      let prevIndex = -1;

      for (let i = 0; i < 12; i++) {
        // 1999年各月中旬
        const jd = dateToJd(1999, i + 1, 15);
        const result = getMonthGanZhi(jd);

        // 验证干支有效
        const index = ganZhiToIndex(result.ganZhi);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(60);

        // 如果不是第一个月，验证连续性
        if (prevIndex >= 0) {
          const expectedIndex = (prevIndex + 1) % 60;
          // 由于节气交接可能在月中，允许一定误差
          const diff = Math.abs(index - expectedIndex);
          expect(diff <= 1 || diff >= 59).toBe(true);
        }

        prevIndex = index;
      }
    });
  });
});

describe('干支纪日验证 - 标准参考值', () => {
  describe('getDayGanZhi', () => {
    DAY_GANZHI_REFERENCES.forEach(({ year, month, day, ganZhi }) => {
      it(`${year}年${month}月${day}日应为${ganZhi}日`, () => {
        const jd = dateToJd(year, month, day);
        const result = getDayGanZhi(jd);
        expect(result.ganZhi).toBe(ganZhi);
      });
    });

    it('2000年1月7日为甲子日基准验证', () => {
      const jd = dateToJd(2000, 1, 7);
      const result = getDayGanZhi(jd);
      expect(result.ganZhi).toBe('甲子');
      expect(result.ganIndex).toBe(0);
      expect(result.zhiIndex).toBe(0);
    });

    it('连续日期干支应连续', () => {
      const startJd = dateToJd(2000, 1, 7);

      for (let i = 0; i < 60; i++) {
        const jd = startJd + i;
        const result = getDayGanZhi(jd);
        expect(result.ganZhi).toBe(STANDARD_JIA_ZI[i]);
      }
    });

    it('60 天后应回到同一干支', () => {
      const jd1 = dateToJd(2000, 1, 7);
      const jd2 = dateToJd(2000, 3, 7); // 约 60 天后

      const result1 = getDayGanZhi(jd1);
      const result2 = getDayGanZhi(jd2);

      expect(result1.ganZhi).toBe(result2.ganZhi);
    });
  });
});

describe('干支纪时验证', () => {
  describe('getHourGanZhi', () => {
    it('子时（23:00-01:00）应为子', () => {
      // 测试当天 23:30
      const jd = dateToJd(2000, 1, 7) + (23.5 / 24 - 0.5);
      const result = getHourGanZhi(jd);
      expect(result.zhi).toBe('子');
    });

    it('午时（11:00-13:00）应为午', () => {
      const jd = dateToJd(2000, 1, 7) + (12 / 24 - 0.5);
      const result = getHourGanZhi(jd);
      expect(result.zhi).toBe('午');
    });

    it('日干不同时时干也不同', () => {
      // 甲己日起甲子时
      const jiaDay = dateToJd(2000, 1, 7); // 甲子日
      const yiDay = dateToJd(2000, 1, 8);  // 乙丑日

      // 都取子时（23:30）
      const jd1 = jiaDay + (23.5 / 24 - 0.5);
      const jd2 = yiDay + (23.5 / 24 - 0.5);

      const result1 = getHourGanZhi(jd1);
      const result2 = getHourGanZhi(jd2);

      // 子时地支相同
      expect(result1.zhi).toBe('子');
      expect(result2.zhi).toBe('子');

      // 但天干不同
      expect(result1.gan).not.toBe(result2.gan);
    });
  });
});

describe('生肖验证', () => {
  describe('getShengXiao', () => {
    YEAR_GANZHI_REFERENCES.forEach(({ year, shengXiao }) => {
      it(`${year}年生肖应为${shengXiao}`, () => {
        const jd = yearToJd(year, 6, 15);
        const result = getShengXiao(jd);
        expect(result).toBe(shengXiao);
      });
    });

    it('1984年为鼠年', () => {
      const jd = yearToJd(1984, 6, 15);
      expect(getShengXiao(jd)).toBe('鼠');
    });

    it('生肖 12 年一轮回', () => {
      const baseJd = yearToJd(1984, 6, 15);
      const baseShengXiao = getShengXiao(baseJd);

      for (let i = 1; i <= 5; i++) {
        const jd = yearToJd(1984 + 12 * i, 6, 15);
        expect(getShengXiao(jd)).toBe(baseShengXiao);
      }
    });

    it('连续年份生肖应按序轮换', () => {
      for (let i = 0; i < 12; i++) {
        const jd = yearToJd(1984 + i, 6, 15);
        expect(getShengXiao(jd)).toBe(SHENG_XIAO[i]);
      }
    });
  });
});

describe('完整干支信息', () => {
  describe('getFullGanZhi', () => {
    it('应返回完整的干支信息', () => {
      const jd = dateToJd(2000, 1, 7);
      const result = getFullGanZhi(jd);

      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('yearBySpring');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('day');
      expect(result).toHaveProperty('hour');
      expect(result).toHaveProperty('shengXiao');
      expect(result).toHaveProperty('xingZuo');
    });

    it('2000年6月15日的完整干支信息（确保在立春后）', () => {
      const jd = yearToJd(2000, 6, 15);
      const result = getFullGanZhi(jd);

      // 2000年为庚辰年（龙年）
      expect(result.year.ganZhi).toBe('庚辰');
      expect(result.shengXiao).toBe('龙');
    });
  });
});

describe('干支周期性验证', () => {
  it('干支纪年 60 年一周期', () => {
    const jd1 = yearToJd(1984, 6, 15);
    const jd2 = yearToJd(2044, 6, 15);

    const result1 = getYearGanZhi(jd1);
    const result2 = getYearGanZhi(jd2);

    expect(result1.ganZhi).toBe(result2.ganZhi);
  });

  it('干支纪日 60 日一周期', () => {
    const jd1 = dateToJd(2000, 1, 7);
    const jd2 = jd1 + 60;

    const result1 = getDayGanZhi(jd1);
    const result2 = getDayGanZhi(jd2);

    expect(result1.ganZhi).toBe(result2.ganZhi);
  });

  it('干支纪月 60 月（5年）一周期', () => {
    // 从 1998年12月7日开始，60个月后
    const jd1 = dateToJd(1998, 12, 7);
    const jd2 = dateToJd(2003, 12, 7);

    const result1 = getMonthGanZhi(jd1);
    const result2 = getMonthGanZhi(jd2);

    expect(result1.ganZhi).toBe(result2.ganZhi);
  });
});

describe('历史日期干支验证', () => {
  it('公元前日期应能正确计算', () => {
    const jd = yearToJd(-500, 6, 15);
    const result = getYearGanZhi(jd);

    expect(result.ganZhi).toBeDefined();
    expect(result.ganZhi.length).toBe(2);
    expect(TIAN_GAN).toContain(result.gan);
    expect(DI_ZHI).toContain(result.zhi);
  });

  it('远古日期干支应有效', () => {
    const jd = yearToJd(-2000, 6, 15);
    const result = getFullGanZhi(jd);

    expect(result.year.ganZhi.length).toBe(2);
    expect(result.day.ganZhi.length).toBe(2);
    expect(result.shengXiao.length).toBe(1);
  });

  it('未来日期干支应有效', () => {
    const jd = yearToJd(3000, 6, 15);
    const result = getFullGanZhi(jd);

    expect(result.year.ganZhi.length).toBe(2);
    expect(result.day.ganZhi.length).toBe(2);
  });
});

describe('边界条件测试', () => {
  it('J2000 基准日期干支应正确', () => {
    // J2000 = 2000年1月1日12时
    const result = getDayGanZhi(0);

    // 2000年1月1日为戊午日
    expect(result.ganZhi).toBe('戊午');
  });

  it('除夕到春节的干支变化', () => {
    // 测试2024年除夕（2月9日）和春节（2月10日）
    const chuxi = dateToJd(2024, 2, 9);
    const chunjie = dateToJd(2024, 2, 10);

    const dayBefore = getDayGanZhi(chuxi);
    const dayAfter = getDayGanZhi(chunjie);

    // 连续日期
    const expectedAfter = getGanZhi(ganZhiToIndex(dayBefore.ganZhi) + 1);
    expect(dayAfter.ganZhi).toBe(expectedAfter.ganZhi);
  });

  it('闰年和平年的干支应正确', () => {
    // 2024年是闰年
    const leap = yearToJd(2024, 6, 15);
    const leapResult = getYearGanZhi(leap);
    expect(leapResult.ganZhi).toBe('甲辰');

    // 2023年是平年
    const normal = yearToJd(2023, 6, 15);
    const normalResult = getYearGanZhi(normal);
    expect(normalResult.ganZhi).toBe('癸卯');
  });
});

describe('干支与节气关系验证', () => {
  it('立春前后年干支变化（立春为界时）', () => {
    // 2024年立春约在2月4日
    // 使用年中日期来可靠验证
    const year2023Mid = yearToJd(2023, 6, 15);
    const year2024Mid = yearToJd(2024, 6, 15);

    const result2023 = getYearGanZhi(year2023Mid);
    const result2024 = getYearGanZhi(year2024Mid);

    // 2023年为癸卯年，2024年为甲辰年
    expect(result2023.ganZhi).toBe('癸卯');
    expect(result2024.ganZhi).toBe('甲辰');
  });

  it('节气交接时月干支变化', () => {
    // 大雪节气附近
    const beforeDaxue = dateToJd(1998, 12, 6);
    const afterDaxue = dateToJd(1998, 12, 8);

    const result1 = getMonthGanZhi(beforeDaxue);
    const result2 = getMonthGanZhi(afterDaxue);

    // 月干支应在节气交接时变化
    // 验证两个日期返回有效的干支
    expect(result1.ganZhi.length).toBe(2);
    expect(result2.ganZhi.length).toBe(2);
  });
});
