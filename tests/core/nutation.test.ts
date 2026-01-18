import { describe, it, expect } from 'vitest';
import {
  calculateNutation,
  calculateNutationApprox,
  calculateLongitudeNutation,
  calculateEquatorialNutation,
  NUTATION_TABLE,
} from '../../src/core/nutation';

describe('章动计算 (nutation)', () => {
  describe('NUTATION_TABLE', () => {
    it('应该包含章动序列数据', () => {
      // 每项11个数，共77项
      expect(NUTATION_TABLE.length).toBe(77 * 11);
    });
  });

  describe('calculateNutation - 完整章动计算', () => {
    it('J2000 时刻的章动应该接近 0', () => {
      const result = calculateNutation(0);
      // J2000 时刻章动值很小但不为零
      expect(Math.abs(result.longitudeNutation)).toBeLessThan(0.001); // 小于 0.001 弧度
      expect(Math.abs(result.obliquityNutation)).toBeLessThan(0.001);
    });

    it('章动值应该在合理范围内', () => {
      // 2024年初的儒略世纪数
      const julianCentury = (2460310.5 - 2451545) / 36525;
      const result = calculateNutation(julianCentury);

      // 黄经章动通常在 ±20 角秒范围内
      const longitudeArcSec = result.longitudeNutation * 180 * 3600 / Math.PI;
      expect(Math.abs(longitudeArcSec)).toBeLessThan(30);

      // 交角章动通常在 ±10 角秒范围内
      const obliquityArcSec = result.obliquityNutation * 180 * 3600 / Math.PI;
      expect(Math.abs(obliquityArcSec)).toBeLessThan(15);
    });

    it('带周期筛选的计算应该返回更少的贡献', () => {
      const julianCentury = 0.5;
      const full = calculateNutation(julianCentury, 0);
      const filtered = calculateNutation(julianCentury, 100); // 只计算周期>100天的项

      // 筛选后的结果应该接近但略有不同
      expect(Math.abs(full.longitudeNutation - filtered.longitudeNutation)).toBeLessThan(0.0001);
    });
  });

  describe('calculateNutationApprox - 中精度章动', () => {
    it('近似计算应该与完整计算接近', () => {
      const julianCentury = 0.24; // 约 2024 年
      const full = calculateNutation(julianCentury);
      const approx = calculateNutationApprox(julianCentury);

      // 近似值应该在几角秒的误差范围内
      const diffLonArcSec = Math.abs(full.longitudeNutation - approx.longitudeNutation) * 180 * 3600 / Math.PI;
      expect(diffLonArcSec).toBeLessThan(5); // 误差小于 5 角秒
    });
  });

  describe('calculateLongitudeNutation - 黄经章动', () => {
    it('应该返回合理的黄经章动值', () => {
      const julianCentury = 0.24;
      const result = calculateLongitudeNutation(julianCentury);
      const arcSec = result * 180 * 3600 / Math.PI;
      expect(Math.abs(arcSec)).toBeLessThan(30);
    });
  });

  describe('calculateEquatorialNutation - 赤道章动', () => {
    it('应该计算赤经和赤纬章动', () => {
      const rightAscension = Math.PI / 4; // 45度
      const declination = Math.PI / 6; // 30度
      const obliquity = 23.4 * Math.PI / 180;
      const longitudeNutation = 0.00005;
      const obliquityNutation = 0.00002;

      const [raNutation, decNutation] = calculateEquatorialNutation(
        rightAscension,
        declination,
        obliquity,
        longitudeNutation,
        obliquityNutation
      );

      // 章动值应该很小
      expect(Math.abs(raNutation)).toBeLessThan(0.001);
      expect(Math.abs(decNutation)).toBeLessThan(0.001);
    });
  });
});
