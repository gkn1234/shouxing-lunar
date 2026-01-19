import { describe, it, expect } from 'vitest';
import {
  calculateShuoQi,
  SOLAR_TERM_NAMES,
  LUNAR_MONTH_NAMES,
  LUNAR_DAY_NAMES,
} from '../../src/lunar/solar-term';
import { gregorianToJD } from '../../src/core/julian';
import { J2000 } from '../../src/core/constants';

describe('节气计算 (solar-term)', () => {
  describe('calculateShuoQi - 实朔实气计算', () => {
    describe('朔日计算', () => {
      it('2024年2月10日附近应有朔日（春节）', () => {
        // 2024年2月10日是春节，即农历正月初一（朔日）
        const jd = gregorianToJD(2024, 2, 10) - J2000;
        const shuo = calculateShuoQi(jd, 'shuo');
        // 朔日应该在2024年2月10日附近 (允许2天误差)
        expect(Math.abs(shuo - jd)).toBeLessThan(2);
      });

      it('2023年1月22日附近应有朔日（春节）', () => {
        // 2023年1月22日是春节
        const jd = gregorianToJD(2023, 1, 22) - J2000;
        const shuo = calculateShuoQi(jd, 'shuo');
        expect(Math.abs(shuo - jd)).toBeLessThan(2);
      });

      it('朔日周期约为29-30天', () => {
        const jd1 = gregorianToJD(2024, 1, 11) - J2000;
        const shuo1 = calculateShuoQi(jd1, 'shuo');
        const shuo2 = calculateShuoQi(shuo1 + 30, 'shuo');
        const diff = shuo2 - shuo1;
        // 朔望月约29-30天
        expect(diff).toBeGreaterThanOrEqual(29);
        expect(diff).toBeLessThanOrEqual(30);
      });
    });

    describe('节气计算', () => {
      it('2024年立春应在2月4日前后', () => {
        // 2024年立春约在2月4日
        const jd = gregorianToJD(2024, 2, 4) - J2000;
        const qi = calculateShuoQi(jd, 'qi');
        // 差异应在2天以内
        expect(Math.abs(qi - jd)).toBeLessThan(2);
      });

      it('2024年春分应在3月20日前后', () => {
        // 2024年春分约在3月20日
        const jd = gregorianToJD(2024, 3, 20) - J2000;
        const qi = calculateShuoQi(jd, 'qi');
        expect(Math.abs(qi - jd)).toBeLessThan(2);
      });

      it('2024年夏至应在6月21日前后', () => {
        // 2024年夏至约在6月21日
        const jd = gregorianToJD(2024, 6, 21) - J2000;
        const qi = calculateShuoQi(jd, 'qi');
        expect(Math.abs(qi - jd)).toBeLessThan(2);
      });

      it('2024年冬至应在12月21日前后', () => {
        // 2024年冬至约在12月21日
        const jd = gregorianToJD(2024, 12, 21) - J2000;
        const qi = calculateShuoQi(jd, 'qi');
        expect(Math.abs(qi - jd)).toBeLessThan(2);
      });

      it('节气间隔约为15天', () => {
        const jd = gregorianToJD(2024, 3, 5) - J2000; // 惊蛰附近
        const qi1 = calculateShuoQi(jd, 'qi');
        const qi2 = calculateShuoQi(qi1 + 16, 'qi');
        const diff = qi2 - qi1;
        // 节气间隔约14-16天
        expect(diff).toBeGreaterThan(14);
        expect(diff).toBeLessThan(17);
      });
    });
  });

  describe('常量数据', () => {
    it('SOLAR_TERM_NAMES 应包含24个节气', () => {
      expect(SOLAR_TERM_NAMES.length).toBe(24);
      expect(SOLAR_TERM_NAMES[0]).toBe('冬至');
      expect(SOLAR_TERM_NAMES[3]).toBe('立春');
      expect(SOLAR_TERM_NAMES[6]).toBe('春分');
      expect(SOLAR_TERM_NAMES[12]).toBe('夏至');
      expect(SOLAR_TERM_NAMES[18]).toBe('秋分');
    });

    it('LUNAR_MONTH_NAMES 应包含12个月名', () => {
      expect(LUNAR_MONTH_NAMES.length).toBe(12);
      // 月名从十一月开始（对应月建）
      expect(LUNAR_MONTH_NAMES[0]).toBe('十一');
      expect(LUNAR_MONTH_NAMES[2]).toBe('正');
    });

    it('LUNAR_DAY_NAMES 应包含30个日名', () => {
      expect(LUNAR_DAY_NAMES.length).toBe(30);
      expect(LUNAR_DAY_NAMES[0]).toBe('初一');
      expect(LUNAR_DAY_NAMES[14]).toBe('十五');
      expect(LUNAR_DAY_NAMES[29]).toBe('三十');
    });
  });
});
