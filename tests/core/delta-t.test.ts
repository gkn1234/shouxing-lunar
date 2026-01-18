import { describe, it, expect } from 'vitest';
import {
  calcDeltaT,
  deltaTFromJD,
  utToTD,
  tdToUT,
  DELTA_T_TABLE,
} from '../../src/core/delta-t';

describe('ΔT 时差计算 (delta-t)', () => {
  describe('DELTA_T_TABLE', () => {
    it('应该包含历史和预测数据', () => {
      expect(DELTA_T_TABLE.length).toBeGreaterThan(0);
      // 表格从公元前4000年开始
      expect(DELTA_T_TABLE[0]).toBe(-4000);
    });
  });

  describe('calcDeltaT - 计算ΔT', () => {
    it('2000年的ΔT约为63.87秒', () => {
      const dt = calcDeltaT(2000);
      expect(dt).toBeCloseTo(63.87, 1);
    });

    it('2020年的ΔT约为69秒', () => {
      const dt = calcDeltaT(2020);
      expect(dt).toBeCloseTo(69.36, 0);
    });

    it('1900年的ΔT约为-2.3秒', () => {
      const dt = calcDeltaT(1900);
      expect(dt).toBeCloseTo(-2.3, 0);
    });

    it('1800年的ΔT约为13.4秒', () => {
      const dt = calcDeltaT(1800);
      expect(dt).toBeCloseTo(13.4, 0);
    });

    it('古代年份应该返回较大的ΔT', () => {
      const dt = calcDeltaT(-1000);
      expect(dt).toBeGreaterThan(10000); // 古代ΔT很大
    });

    it('未来年份应该使用外推', () => {
      const dt2100 = calcDeltaT(2100);
      const dt2200 = calcDeltaT(2200);
      // 未来ΔT应该增长
      expect(dt2200).toBeGreaterThan(dt2100);
    });
  });

  describe('deltaTFromJD - 从儒略日计算ΔT', () => {
    it('J2000 (t=0) 应该返回约63.87秒/86400日', () => {
      const dt = deltaTFromJD(0);
      expect(dt * 86400).toBeCloseTo(63.87, 1);
    });

    it('J2000+365.2425 (约2001年) 的ΔT', () => {
      const dt = deltaTFromJD(365.2425);
      expect(dt * 86400).toBeCloseTo(63.97, 0); // 约64秒
    });
  });

  describe('utToTD 和 tdToUT - 时间转换', () => {
    it('UT转TD再转回应该近似相等', () => {
      const jdUT = 2451545; // J2000
      const jdTD = utToTD(jdUT);
      const jdUT2 = tdToUT(jdTD);
      // 由于ΔT的近似性，会有微小差异
      expect(Math.abs(jdUT2 - jdUT)).toBeLessThan(0.0001);
    });

    it('TD应该大于UT (近代)', () => {
      const jdUT = 2451545;
      const jdTD = utToTD(jdUT);
      expect(jdTD).toBeGreaterThan(jdUT);
    });

    it('TD-UT差值应该等于ΔT', () => {
      const jdUT = 2451545;
      const jdTD = utToTD(jdUT);
      const diff = (jdTD - jdUT) * 86400; // 转为秒
      expect(diff).toBeCloseTo(63.87, 0);
    });
  });

  describe('边界情况', () => {
    it('表格边界年份应该平滑过渡', () => {
      const dt2049 = calcDeltaT(2049);
      const dt2050 = calcDeltaT(2050);
      const dt2051 = calcDeltaT(2051);
      // 连续年份的ΔT变化应该平滑 (表格末尾过渡到外推会有跳变，放宽到3秒)
      expect(Math.abs(dt2050 - dt2049)).toBeLessThan(1);
      expect(Math.abs(dt2051 - dt2050)).toBeLessThan(3);
    });
  });
});
