import { describe, it, expect } from 'vitest';
import {
  SOLAR_FESTIVALS,
  LUNAR_FESTIVALS,
  WEEK_FESTIVALS,
  getSolarFestivals,
  getLunarFestivals,
  getWeekFestivals,
  getAllFestivals,
} from '../../src/lunar/festival';

describe('节日数据 (festival)', () => {
  describe('节日常量', () => {
    it('SOLAR_FESTIVALS 应包含常见公历节日', () => {
      // 使用 MMDD 格式的 key
      expect(SOLAR_FESTIVALS['0101']).toBeDefined();
      expect(SOLAR_FESTIVALS['0101'].some(f => f.name === '元旦')).toBe(true);

      expect(SOLAR_FESTIVALS['0501']).toBeDefined();
      expect(SOLAR_FESTIVALS['0501'].some(f => f.name === '劳动节')).toBe(true);

      expect(SOLAR_FESTIVALS['1001']).toBeDefined();
      expect(SOLAR_FESTIVALS['1001'].some(f => f.name === '国庆节')).toBe(true);
    });

    it('LUNAR_FESTIVALS 应包含常见农历节日', () => {
      // 使用 MMDD 格式的 key
      expect(LUNAR_FESTIVALS['0101']).toBeDefined();
      expect(LUNAR_FESTIVALS['0101'].some(f => f.name === '春节')).toBe(true);

      expect(LUNAR_FESTIVALS['0115']).toBeDefined();
      expect(LUNAR_FESTIVALS['0115'].some(f => f.name === '元宵节')).toBe(true);

      expect(LUNAR_FESTIVALS['0505']).toBeDefined();
      expect(LUNAR_FESTIVALS['0505'].some(f => f.name === '端午节')).toBe(true);

      expect(LUNAR_FESTIVALS['0815']).toBeDefined();
      expect(LUNAR_FESTIVALS['0815'].some(f => f.name === '中秋节')).toBe(true);
    });

    it('WEEK_FESTIVALS 应包含星期类节日', () => {
      // 使用 MMWWD 格式的 key (MM=月, WW=第几周, D=星期)
      // 母亲节：5月第2个星期日
      expect(WEEK_FESTIVALS['05020']).toBeDefined();
      expect(WEEK_FESTIVALS['05020'].some(f => f.name === '母亲节')).toBe(true);

      // 父亲节：6月第3个星期日
      expect(WEEK_FESTIVALS['06030']).toBeDefined();
      expect(WEEK_FESTIVALS['06030'].some(f => f.name === '父亲节')).toBe(true);

      // 感恩节：11月第4个星期四
      expect(WEEK_FESTIVALS['11044']).toBeDefined();
      expect(WEEK_FESTIVALS['11044'].some(f => f.name === '感恩节')).toBe(true);
    });
  });

  describe('getSolarFestivals - 获取公历节日', () => {
    it('1月1日应返回元旦', () => {
      const festivals = getSolarFestivals(1, 1);
      expect(festivals.some(f => f.name === '元旦')).toBe(true);
    });

    it('2月14日应返回情人节', () => {
      const festivals = getSolarFestivals(2, 14);
      expect(festivals.some(f => f.name === '情人节')).toBe(true);
    });

    it('非节日日期应返回空数组', () => {
      const festivals = getSolarFestivals(1, 2);
      expect(festivals.length).toBe(0);
    });
  });

  describe('getLunarFestivals - 获取农历节日', () => {
    it('正月初一应返回春节', () => {
      const festivals = getLunarFestivals(1, 1, false);
      expect(festivals.some(f => f.name === '春节')).toBe(true);
    });

    it('八月十五应返回中秋节', () => {
      const festivals = getLunarFestivals(8, 15, false);
      expect(festivals.some(f => f.name === '中秋节')).toBe(true);
    });

    it('闰月初一不应返回节日', () => {
      const festivals = getLunarFestivals(1, 1, true);
      expect(festivals.length).toBe(0);
    });

    it('除夕应正确判断', () => {
      // 大月除夕（三十）
      const festivals1 = getLunarFestivals(12, 30, false, 30);
      expect(festivals1.some(f => f.name === '除夕')).toBe(true);

      // 小月除夕（廿九）
      const festivals2 = getLunarFestivals(12, 29, false, 29);
      expect(festivals2.some(f => f.name === '除夕')).toBe(true);
    });
  });

  describe('getWeekFestivals - 获取星期类节日', () => {
    it('5月第2个星期日应返回母亲节', () => {
      const festivals = getWeekFestivals(5, 2, 0);
      expect(festivals.some(f => f.name === '母亲节')).toBe(true);
    });

    it('11月第4个星期四应返回感恩节', () => {
      const festivals = getWeekFestivals(11, 4, 4);
      expect(festivals.some(f => f.name === '感恩节')).toBe(true);
    });
  });

  describe('getAllFestivals - 获取所有节日', () => {
    it('应返回正确的节日结构', () => {
      const festivals = getAllFestivals(1, 1, 2024, 11, 20, false, 30, 1, 1, 5);

      expect(festivals).toHaveProperty('solar');
      expect(festivals).toHaveProperty('lunar');
      expect(festivals).toHaveProperty('week');
      expect(festivals).toHaveProperty('allNames');

      // 1月1日应有元旦
      expect(festivals.solar.some(f => f.name === '元旦')).toBe(true);
    });

    it('春节应同时出现在农历和allNames中', () => {
      const festivals = getAllFestivals(2, 10, 2024, 1, 1, false, 30, 2, 6, 4);

      expect(festivals.lunar.some(f => f.name === '春节')).toBe(true);
      expect(festivals.allNames.includes('春节')).toBe(true);
    });
  });
});
