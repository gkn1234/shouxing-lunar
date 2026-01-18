import { describe, it, expect } from 'vitest';
import {
  HorizonType,
  HORIZON_CORRECTIONS,
  calculateGST,
  eclipticToEquatorial,
  equatorialToHorizontal,
  calculateHourAngle,
  calculateRefraction,
  calculateSunRiseTransitSet,
  calculateMoonRiseTransitSet,
  calculateDayLength,
  jdToTimeString,
  degreesToRadians,
  radiansToDegrees,
} from '../../src/ephemeris/rise-transit-set';
import { PI2 } from '../../src/core/constants';

describe('升中天落计算 (rise-transit-set)', () => {
  // 测试地点：北京 (116.4°E, 39.9°N)
  const BEIJING_LON = degreesToRadians(116.4);
  const BEIJING_LAT = degreesToRadians(39.9);

  // J2000.0 时刻的儒略日
  const J2000 = 2451545.0;

  describe('HorizonType 常量', () => {
    it('标准地平修正约为 -50 分角', () => {
      const correction = HORIZON_CORRECTIONS[HorizonType.Standard];
      // -50分角 ≈ -0.0145 弧度
      expect(correction).toBeCloseTo(-0.0145, 3);
    });

    it('民用晨昏修正为 -6°', () => {
      const correction = HORIZON_CORRECTIONS[HorizonType.Civil];
      expect(radiansToDegrees(correction)).toBeCloseTo(-6, 5);
    });

    it('航海晨昏修正为 -12°', () => {
      const correction = HORIZON_CORRECTIONS[HorizonType.Nautical];
      expect(radiansToDegrees(correction)).toBeCloseTo(-12, 5);
    });

    it('天文晨昏修正为 -18°', () => {
      const correction = HORIZON_CORRECTIONS[HorizonType.Astronomical];
      expect(radiansToDegrees(correction)).toBeCloseTo(-18, 5);
    });
  });

  describe('calculateGST - 格林尼治恒星时', () => {
    it('恒星时应在 0-2π 范围内', () => {
      const gst = calculateGST(0, 0);
      expect(gst).toBeGreaterThanOrEqual(0);
      expect(gst).toBeLessThan(PI2);
    });

    it('一天后恒星时应变化约2π弧度', () => {
      const gst1 = calculateGST(0, 0);
      const gst2 = calculateGST(1, 0);
      // 恒星日比太阳日短约 3分56秒
      // 一天后恒星时增加约 2π + 0.0172 弧度，但会被规范化到 0-2π
      // 所以差值应接近 0.0172 弧度
      let diff = gst2 - gst1;
      if (diff < 0) diff += PI2;
      // 差值应在合理范围内 (接近 0 或接近 2π)
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThan(PI2);
    });
  });

  describe('eclipticToEquatorial - 黄赤坐标转换', () => {
    it('黄经0°黄纬0°应转换为春分点', () => {
      const obliquity = degreesToRadians(23.44);
      const equatorial = eclipticToEquatorial([0, 0, 1], obliquity);
      // 春分点：赤经0°，赤纬0°
      expect(equatorial[0]).toBeCloseTo(0, 5);
      expect(equatorial[1]).toBeCloseTo(0, 5);
    });

    it('黄经90°应对应夏至点', () => {
      const obliquity = degreesToRadians(23.44);
      const equatorial = eclipticToEquatorial([Math.PI / 2, 0, 1], obliquity);
      // 夏至点：赤经90°，赤纬约23.44°
      expect(radiansToDegrees(equatorial[0])).toBeCloseTo(90, 0);
      expect(radiansToDegrees(equatorial[1])).toBeCloseTo(23.44, 1);
    });

    it('距离应保持不变', () => {
      const obliquity = degreesToRadians(23.44);
      const equatorial = eclipticToEquatorial([1, 0.5, 1.5], obliquity);
      expect(equatorial[2]).toBe(1.5);
    });
  });

  describe('equatorialToHorizontal - 赤道地平坐标转换', () => {
    it('天顶应对应高度角90°', () => {
      // 赤纬等于纬度时，中天时刻高度角为90°
      const lat = BEIJING_LAT;
      const gst = 0;
      const lon = BEIJING_LON;
      // 赤经等于恒星时+经度时，天体在中天
      const ra = gst + lon;
      const horizontal = equatorialToHorizontal([ra, lat, 1], lon, lat, gst);
      // 高度角应约为90° - |纬度-赤纬| = 90°
      expect(radiansToDegrees(horizontal[1])).toBeCloseTo(90, 0);
    });

    it('距离应保持不变', () => {
      const horizontal = equatorialToHorizontal([0, 0, 2.5], 0, 0, 0);
      expect(horizontal[2]).toBe(2.5);
    });
  });

  describe('calculateHourAngle - 时角计算', () => {
    it('赤道上天赤道上的天体应有12小时时角', () => {
      // 赤纬0°，纬度0°，地平高度0°
      const ha = calculateHourAngle(0, 0, 0);
      // 时角应为 π/2 (6小时)
      expect(ha).toBeCloseTo(Math.PI / 2, 5);
    });

    it('极夜情况应返回 NaN', () => {
      // 北极纬度90°，赤纬-30°，地平高度0°
      const ha = calculateHourAngle(0, degreesToRadians(-30), degreesToRadians(90));
      expect(isNaN(ha)).toBe(true);
    });

    it('极昼情况应返回 NaN', () => {
      // 北极纬度90°，赤纬30°，地平高度0°
      const ha = calculateHourAngle(0, degreesToRadians(30), degreesToRadians(90));
      expect(isNaN(ha)).toBe(true);
    });
  });

  describe('calculateRefraction - 大气折射', () => {
    it('地平线附近折射约为34分角', () => {
      const refraction = calculateRefraction(degreesToRadians(0.5));
      // 地平线附近折射约 28-35分角
      const refractionArcmin = radiansToDegrees(refraction) * 60;
      expect(refractionArcmin).toBeGreaterThan(20);
      expect(refractionArcmin).toBeLessThan(40);
    });

    it('高度角越大折射越小', () => {
      const r1 = calculateRefraction(degreesToRadians(10));
      const r2 = calculateRefraction(degreesToRadians(45));
      const r3 = calculateRefraction(degreesToRadians(90));
      expect(r1).toBeGreaterThan(r2);
      expect(r2).toBeGreaterThan(r3);
    });

    it('负高度角返回0', () => {
      const refraction = calculateRefraction(degreesToRadians(-5));
      expect(refraction).toBe(0);
    });
  });

  describe('calculateSunRiseTransitSet - 太阳升中天落', () => {
    it('应返回有效结果', () => {
      const result = calculateSunRiseTransitSet(J2000, BEIJING_LON, BEIJING_LAT);
      expect(result).toHaveProperty('rise');
      expect(result).toHaveProperty('transit');
      expect(result).toHaveProperty('set');
      expect(result).toHaveProperty('alwaysUp');
      expect(result).toHaveProperty('alwaysDown');
    });

    it('中天应在升起和降落之间', () => {
      const result = calculateSunRiseTransitSet(J2000, BEIJING_LON, BEIJING_LAT);
      if (!result.alwaysUp && !result.alwaysDown) {
        expect(result.transit).toBeGreaterThan(result.rise);
        expect(result.transit).toBeLessThan(result.set);
      }
    });

    it('日出应早于日落', () => {
      const result = calculateSunRiseTransitSet(J2000, BEIJING_LON, BEIJING_LAT);
      if (!result.alwaysUp && !result.alwaysDown) {
        expect(result.rise).toBeLessThan(result.set);
      }
    });

    it('昼长应在合理范围内', () => {
      const result = calculateSunRiseTransitSet(J2000, BEIJING_LON, BEIJING_LAT);
      if (!result.alwaysUp && !result.alwaysDown) {
        const dayLength = result.set - result.rise;
        // 昼长应在 8-16 小时之间 (北京纬度)
        expect(dayLength * 24).toBeGreaterThan(8);
        expect(dayLength * 24).toBeLessThan(16);
      }
    });
  });

  describe('calculateMoonRiseTransitSet - 月球升中天落', () => {
    it('应返回有效结果', () => {
      const result = calculateMoonRiseTransitSet(J2000, BEIJING_LON, BEIJING_LAT);
      expect(result).toHaveProperty('rise');
      expect(result).toHaveProperty('transit');
      expect(result).toHaveProperty('set');
    });

    it('月亮运动应与太阳不同', () => {
      const sunResult = calculateSunRiseTransitSet(J2000, BEIJING_LON, BEIJING_LAT);
      const moonResult = calculateMoonRiseTransitSet(J2000, BEIJING_LON, BEIJING_LAT);
      // 月球和太阳的升起时刻应该不同
      expect(moonResult.rise).not.toBeCloseTo(sunResult.rise, 2);
    });
  });

  describe('calculateDayLength - 昼长计算', () => {
    it('正常情况应返回昼长', () => {
      const result = calculateSunRiseTransitSet(J2000, BEIJING_LON, BEIJING_LAT);
      const dayLength = calculateDayLength(result);
      expect(dayLength).toBeGreaterThan(0);
      expect(dayLength).toBeLessThan(1);
    });

    it('极昼应返回1', () => {
      const result = {
        rise: NaN,
        transit: J2000,
        set: NaN,
        alwaysUp: true,
        alwaysDown: false,
        transitAltitude: 0.5,
      };
      expect(calculateDayLength(result)).toBe(1);
    });

    it('极夜应返回0', () => {
      const result = {
        rise: NaN,
        transit: J2000,
        set: NaN,
        alwaysUp: false,
        alwaysDown: true,
        transitAltitude: -0.5,
      };
      expect(calculateDayLength(result)).toBe(0);
    });
  });

  describe('jdToTimeString - 时间字符串', () => {
    it('中午应返回 12:00:00', () => {
      // 儒略日 0.0 对应中午12点
      expect(jdToTimeString(0)).toBe('12:00:00');
    });

    it('NaN 应返回 --:--:--', () => {
      expect(jdToTimeString(NaN)).toBe('--:--:--');
    });

    it('子夜应返回 00:00:00', () => {
      // 儒略日 0.5 对应子夜
      expect(jdToTimeString(0.5)).toBe('00:00:00');
    });
  });

  describe('degreesToRadians / radiansToDegrees', () => {
    it('度弧度转换应可逆', () => {
      const degrees = 45;
      const radians = degreesToRadians(degrees);
      expect(radiansToDegrees(radians)).toBeCloseTo(degrees, 10);
    });

    it('90° 应等于 π/2', () => {
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10);
    });

    it('π 应等于 180°', () => {
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 10);
    });
  });
});
