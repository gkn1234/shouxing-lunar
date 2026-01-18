import { describe, it, expect } from 'vitest';
import {
  calculatePrecessionParameter,
  calculateObliquity,
  equatorialJ2000ToDate,
  equatorialDateToJ2000,
  eclipticJ2000ToDate,
  eclipticDateToJ2000,
} from '../../src/core/precession';
import type { SphericalCoord } from '../../src/core/coordinate';

describe('岁差计算 (precession)', () => {
  describe('calculatePrecessionParameter', () => {
    it('J2000 时刻的 θ 参数应该接近 0', () => {
      const theta = calculatePrecessionParameter(0, 'th', 'P03');
      expect(Math.abs(theta)).toBeLessThan(0.0001);
    });

    it('不同模型应该给出相近的结果', () => {
      const julianCentury = 0.5;
      const p03 = calculatePrecessionParameter(julianCentury, 'p', 'P03');
      const iau2000 = calculatePrecessionParameter(julianCentury, 'p', 'IAU2000');
      const iau1976 = calculatePrecessionParameter(julianCentury, 'p', 'IAU1976');

      // 一般岁差在短时间内差异不大
      expect(Math.abs(p03 - iau2000)).toBeLessThan(0.00001);
      expect(Math.abs(p03 - iau1976)).toBeLessThan(0.0001);
    });
  });

  describe('calculateObliquity - 黄赤交角', () => {
    it('J2000 的黄赤交角应该约为 23.44 度', () => {
      const obliquity = calculateObliquity(0);
      const degrees = obliquity * 180 / Math.PI;
      expect(degrees).toBeCloseTo(23.44, 1);
    });

    it('黄赤交角应该随时间缓慢减小', () => {
      const obliquity2000 = calculateObliquity(0);
      const obliquity2100 = calculateObliquity(1); // 1世纪后

      // 黄赤交角在减小
      expect(obliquity2100).toBeLessThan(obliquity2000);

      // 变化约 0.013 度/世纪
      const changePerCentury = (obliquity2000 - obliquity2100) * 180 / Math.PI;
      expect(changePerCentury).toBeCloseTo(0.013, 2);
    });
  });

  describe('赤道坐标岁差旋转', () => {
    it('J2000 坐标往返转换应该保持一致', () => {
      const original: SphericalCoord = [Math.PI / 4, Math.PI / 6, 1];
      const julianCentury = 0.5;

      const toDate = equatorialJ2000ToDate(julianCentury, original, 'P03');
      const backToJ2000 = equatorialDateToJ2000(julianCentury, toDate, 'P03');

      expect(backToJ2000[0]).toBeCloseTo(original[0], 8);
      expect(backToJ2000[1]).toBeCloseTo(original[1], 8);
      expect(backToJ2000[2]).toBeCloseTo(original[2], 8);
    });

    it('春分点的赤经应该因岁差而变化', () => {
      // 春分点在 J2000: 赤经=0, 赤纬=0
      const vernalEquinox: SphericalCoord = [0, 0, 1];
      const julianCentury = 1; // 100年后

      const toDate = equatorialJ2000ToDate(julianCentury, vernalEquinox, 'P03');

      // 春分点的赤经应该增加 (岁差导致坐标系旋转)
      // 每年约 50 角秒 = 100年约 5000 角秒 ≈ 1.4 度
      const changeInDegrees = toDate[0] * 180 / Math.PI;
      expect(changeInDegrees).toBeCloseTo(1.4, 0);
    });
  });

  describe('黄道坐标岁差旋转', () => {
    it('黄道坐标往返转换应该保持一致', () => {
      const original: SphericalCoord = [Math.PI / 3, Math.PI / 12, 1];
      const julianCentury = 0.5;

      const toDate = eclipticJ2000ToDate(julianCentury, original, 'P03');
      const backToJ2000 = eclipticDateToJ2000(julianCentury, toDate, 'P03');

      expect(backToJ2000[0]).toBeCloseTo(original[0], 6);
      expect(backToJ2000[1]).toBeCloseTo(original[1], 6);
      expect(backToJ2000[2]).toBeCloseTo(original[2], 8);
    });
  });

  describe('不同模型比较', () => {
    it('P03 和 IAU2000 在短期内应该非常接近', () => {
      const coord: SphericalCoord = [Math.PI / 4, Math.PI / 6, 1];
      const julianCentury = 0.24; // 约 2024 年

      const p03Result = equatorialJ2000ToDate(julianCentury, coord, 'P03');
      const iau2000Result = equatorialJ2000ToDate(julianCentury, coord, 'IAU2000');

      // 差异应该很小
      const raDiff = Math.abs(p03Result[0] - iau2000Result[0]);
      const decDiff = Math.abs(p03Result[1] - iau2000Result[1]);

      expect(raDiff).toBeLessThan(0.00001);
      expect(decDiff).toBeLessThan(0.00001);
    });
  });
});
