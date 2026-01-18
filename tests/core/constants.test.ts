import { describe, it, expect } from 'vitest';
import {
  RAD,
  RADD,
  PI2,
  PI_2,
  J2000,
  CS_R_EARTH,
  CS_AU,
  CS_K,
  CS_K2,
  CS_S_SUN,
  PLANET_NAMES_CN,
  WEEK_NAMES_CN,
} from '../../src/core/constants';

describe('天文常数 (constants)', () => {
  describe('角度转换常数', () => {
    it('RAD 应该等于每弧度的角秒数', () => {
      // 1 弧度 = 180/π 度 = 180*3600/π 角秒
      expect(RAD).toBeCloseTo(206264.80624709636, 5);
    });

    it('RADD 应该等于每弧度的度数', () => {
      expect(RADD).toBeCloseTo(57.29577951308232, 10);
    });

    it('PI2 应该等于 2π', () => {
      expect(PI2).toBeCloseTo(Math.PI * 2, 15);
    });

    it('PI_2 应该等于 π/2', () => {
      expect(PI_2).toBeCloseTo(Math.PI / 2, 15);
    });
  });

  describe('时间基准', () => {
    it('J2000 应该等于 2451545', () => {
      // J2000 = 2000年1月1日12时TT的儒略日数
      expect(J2000).toBe(2451545);
    });
  });

  describe('地球相关常数', () => {
    it('CS_R_EARTH 应该是地球赤道半径', () => {
      expect(CS_R_EARTH).toBe(6378.1366);
    });
  });

  describe('天文单位', () => {
    it('CS_AU 应该是天文单位长度(千米)', () => {
      expect(CS_AU).toBe(1.49597870691e8);
    });
  });

  describe('月亮常数', () => {
    it('CS_K 应该是月亮与地球的半径比(半影)', () => {
      expect(CS_K).toBe(0.2725076);
    });

    it('CS_K2 应该是月亮与地球的半径比(本影)', () => {
      expect(CS_K2).toBe(0.272281);
    });

    it('CS_S_SUN 应该是太阳视半径(角秒)', () => {
      expect(CS_S_SUN).toBe(959.64);
    });
  });

  describe('行星数据', () => {
    it('应该有9个行星名称', () => {
      expect(PLANET_NAMES_CN).toHaveLength(9);
      expect(PLANET_NAMES_CN[0]).toBe('地球');
      expect(PLANET_NAMES_CN[8]).toBe('冥王星');
    });
  });

  describe('星期名称', () => {
    it('应该有7个星期名称', () => {
      expect(WEEK_NAMES_CN).toHaveLength(7);
      expect(WEEK_NAMES_CN[0]).toBe('日');
      expect(WEEK_NAMES_CN[6]).toBe('六');
    });
  });
});
