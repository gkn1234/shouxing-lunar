import { describe, it, expect, beforeEach } from 'vitest';
import {
  TIAN_GAN,
  DI_ZHI,
  SHENG_XIAO,
  XING_ZUO,
  getGanZhi,
  getYearGanZhi,
  getYearGanZhiBySpring,
  getMonthGanZhi,
  getDayGanZhi,
  getHourGanZhi,
  getShengXiao,
  getXingZuo,
  getFullGanZhi,
  ganZhiToIndex,
  JIA_ZI_TABLE,
} from '../../src/lunar/gan-zhi';
import { clearLunarYearCache } from '../../src/lunar/calendar';
import { gregorianToJD } from '../../src/core/julian';
import { J2000 } from '../../src/core/constants';

describe('干支计算 (gan-zhi)', () => {
  beforeEach(() => {
    clearLunarYearCache();
  });

  describe('基础常量', () => {
    it('TIAN_GAN 应包含10个天干', () => {
      expect(TIAN_GAN.length).toBe(10);
      expect(TIAN_GAN[0]).toBe('甲');
      expect(TIAN_GAN[9]).toBe('癸');
    });

    it('DI_ZHI 应包含12个地支', () => {
      expect(DI_ZHI.length).toBe(12);
      expect(DI_ZHI[0]).toBe('子');
      expect(DI_ZHI[11]).toBe('亥');
    });

    it('SHENG_XIAO 应包含12个生肖', () => {
      expect(SHENG_XIAO.length).toBe(12);
      expect(SHENG_XIAO[0]).toBe('鼠');
      expect(SHENG_XIAO[4]).toBe('龙');
      expect(SHENG_XIAO[11]).toBe('猪');
    });

    it('XING_ZUO 应包含12个星座', () => {
      expect(XING_ZUO.length).toBe(12);
      expect(XING_ZUO[0]).toBe('摩羯');
      expect(XING_ZUO[3]).toBe('白羊');
    });

    it('JIA_ZI_TABLE 应包含60个干支组合', () => {
      expect(JIA_ZI_TABLE.length).toBe(60);
      expect(JIA_ZI_TABLE[0]).toBe('甲子');
      expect(JIA_ZI_TABLE[1]).toBe('乙丑');
      expect(JIA_ZI_TABLE[59]).toBe('癸亥');
    });
  });

  describe('getGanZhi - 索引转干支', () => {
    it('索引0应返回甲子', () => {
      const result = getGanZhi(0);
      expect(result.gan).toBe('甲');
      expect(result.zhi).toBe('子');
      expect(result.ganZhi).toBe('甲子');
      expect(result.ganIndex).toBe(0);
      expect(result.zhiIndex).toBe(0);
    });

    it('索引1应返回乙丑', () => {
      const result = getGanZhi(1);
      expect(result.ganZhi).toBe('乙丑');
    });

    it('索引59应返回癸亥', () => {
      const result = getGanZhi(59);
      expect(result.ganZhi).toBe('癸亥');
    });

    it('索引60应循环回甲子', () => {
      const result = getGanZhi(60);
      expect(result.ganZhi).toBe('甲子');
    });

    it('负数索引应正确处理', () => {
      const result = getGanZhi(-1);
      expect(result.ganZhi).toBe('癸亥');
    });
  });

  describe('getYearGanZhi - 年干支（立春为界）', () => {
    it('2024年2月10日后应是甲辰年', () => {
      // 2024年立春后
      const jd = gregorianToJD(2024, 2, 10) - J2000;
      const result = getYearGanZhi(jd);
      expect(result.ganZhi).toBe('甲辰');
    });

    it('2024年1月应仍是癸卯年', () => {
      // 2024年立春前
      const jd = gregorianToJD(2024, 1, 15) - J2000;
      const result = getYearGanZhi(jd);
      expect(result.ganZhi).toBe('癸卯');
    });

    it('2023年应是癸卯年', () => {
      const jd = gregorianToJD(2023, 6, 15) - J2000;
      const result = getYearGanZhi(jd);
      expect(result.ganZhi).toBe('癸卯');
    });

    it('1984年应是甲子年', () => {
      // 1984年是甲子年
      const jd = gregorianToJD(1984, 6, 15) - J2000;
      const result = getYearGanZhi(jd);
      expect(result.ganZhi).toBe('甲子');
    });
  });

  describe('getYearGanZhiBySpring - 年干支（正月初一为界）', () => {
    it('2024年2月10日应是甲辰年', () => {
      // 2024年春节
      const jd = gregorianToJD(2024, 2, 10) - J2000;
      const result = getYearGanZhiBySpring(jd);
      expect(result.ganZhi).toBe('甲辰');
    });

    it('2024年1月应是癸卯年', () => {
      // 2024年春节前一个多月
      const jd = gregorianToJD(2024, 1, 1) - J2000;
      const result = getYearGanZhiBySpring(jd);
      expect(result.ganZhi).toBe('癸卯');
    });
  });

  describe('getMonthGanZhi - 月干支', () => {
    it('应返回有效的干支', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const result = getMonthGanZhi(jd);
      expect(result.ganZhi.length).toBe(2);
      expect(TIAN_GAN).toContain(result.gan);
      expect(DI_ZHI).toContain(result.zhi);
    });
  });

  describe('getDayGanZhi - 日干支', () => {
    it('日干支应连续变化', () => {
      // 测试连续3天的日干支
      const jd1 = gregorianToJD(2024, 1, 1) - J2000;
      const result1 = getDayGanZhi(jd1);
      const result2 = getDayGanZhi(jd1 + 1);
      const result3 = getDayGanZhi(jd1 + 2);

      // 索引应该连续递增
      expect(result2.ganIndex).toBe((result1.ganIndex + 1) % 10);
      expect(result3.ganIndex).toBe((result1.ganIndex + 2) % 10);
    });

    it('60天后应循环回原干支', () => {
      const jd1 = gregorianToJD(2024, 1, 1) - J2000;
      const jd2 = jd1 + 60;
      const result1 = getDayGanZhi(jd1);
      const result2 = getDayGanZhi(jd2);
      expect(result1.ganZhi).toBe(result2.ganZhi);
    });
  });

  describe('getHourGanZhi - 时干支', () => {
    it('应返回有效的干支', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const result = getHourGanZhi(jd);
      expect(result.ganZhi.length).toBe(2);
      expect(TIAN_GAN).toContain(result.gan);
      expect(DI_ZHI).toContain(result.zhi);
    });
  });

  describe('getShengXiao - 生肖', () => {
    it('2024年甲辰年应是龙', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const shengXiao = getShengXiao(jd);
      expect(shengXiao).toBe('龙');
    });

    it('2023年癸卯年应是兔', () => {
      const jd = gregorianToJD(2023, 6, 15) - J2000;
      const shengXiao = getShengXiao(jd);
      expect(shengXiao).toBe('兔');
    });

    it('1984年甲子年应是鼠', () => {
      const jd = gregorianToJD(1984, 6, 15) - J2000;
      const shengXiao = getShengXiao(jd);
      expect(shengXiao).toBe('鼠');
    });
  });

  describe('getXingZuo - 星座', () => {
    it('3月下旬应是白羊座', () => {
      const jd = gregorianToJD(2024, 3, 25) - J2000;
      const xingZuo = getXingZuo(jd);
      expect(xingZuo).toBe('白羊座');
    });

    it('6月下旬应是巨蟹座', () => {
      const jd = gregorianToJD(2024, 6, 25) - J2000;
      const xingZuo = getXingZuo(jd);
      expect(xingZuo).toBe('巨蟹座');
    });

    it('12月25日应是摩羯座', () => {
      const jd = gregorianToJD(2024, 12, 25) - J2000;
      const xingZuo = getXingZuo(jd);
      expect(xingZuo).toBe('摩羯座');
    });
  });

  describe('getFullGanZhi - 完整干支信息', () => {
    it('应返回完整的干支信息结构', () => {
      const jd = gregorianToJD(2024, 6, 15) - J2000;
      const result = getFullGanZhi(jd);

      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('yearBySpring');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('day');
      expect(result).toHaveProperty('hour');
      expect(result).toHaveProperty('shengXiao');
      expect(result).toHaveProperty('xingZuo');

      expect(result.shengXiao).toBe('龙');
    });
  });

  describe('ganZhiToIndex - 干支转索引', () => {
    it('甲子应返回0', () => {
      expect(ganZhiToIndex('甲子')).toBe(0);
    });

    it('乙丑应返回1', () => {
      expect(ganZhiToIndex('乙丑')).toBe(1);
    });

    it('癸亥应返回59', () => {
      expect(ganZhiToIndex('癸亥')).toBe(59);
    });

    it('无效干支应返回-1', () => {
      expect(ganZhiToIndex('甲丑')).toBe(-1); // 干支奇偶不匹配
      expect(ganZhiToIndex('XX')).toBe(-1);
      expect(ganZhiToIndex('甲')).toBe(-1);
    });
  });
});
