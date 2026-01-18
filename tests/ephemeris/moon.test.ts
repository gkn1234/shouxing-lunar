import { describe, it, expect } from 'vitest';
import {
  calculateMoonLongitude,
  calculateMoonLatitude,
  calculateMoonDistance,
  calculateMoonGeocentricCoord,
  calculateMoonLongitudeAberration,
  calculateMoonLatitudeAberration,
  calculateMoonApparentLongitude,
  calculateMoonVelocity,
  calculateTimeFromMoonLongitude,
  calculateMoonApparentCoord,
  calculateMoonAngularRadius,
  MOON_MEAN_DISTANCE,
  MOON_MEAN_ANGULAR_RADIUS,
  MOON_PHASE_NAMES_CN,
  MOON_PHASE_NAMES_EN,
} from '../../src/ephemeris/moon';
import { PI2, RAD } from '../../src/core/constants';

describe('月球位置计算 (moon)', () => {
  describe('calculateMoonLongitude - 月球黄经', () => {
    it('J2000 时刻月球黄经应有合理值', () => {
      // t = 0 对应 J2000.0 (2000年1月1日12时TT)
      const lon = calculateMoonLongitude(0, -1);
      // 黄经应在 0-2π 范围内
      expect(lon).toBeGreaterThanOrEqual(0);
      expect(lon).toBeLessThan(PI2);
    });

    it('使用不同项数应返回相近结果', () => {
      const lon20 = calculateMoonLongitude(0, 20);
      const lonFull = calculateMoonLongitude(0, -1);
      // 20项和全部项的差异应小于20角秒
      expect(Math.abs(lon20 - lonFull)).toBeLessThan(20 / RAD);
    });

    it('月球黄经变化率约为每天13度', () => {
      // 一天 = 1/36525 世纪
      const dayInCentury = 1 / 36525;
      const lon0 = calculateMoonLongitude(0, -1);
      const lon1 = calculateMoonLongitude(dayInCentury, -1);
      // 黄经变化约 13°/天 = 0.227 弧度/天
      const diff = lon1 - lon0;
      // 处理跨越 2π 的情况
      const normalizedDiff = diff < 0 ? diff + PI2 : diff;
      expect(normalizedDiff).toBeGreaterThan(0.20);
      expect(normalizedDiff).toBeLessThan(0.25);
    });
  });

  describe('calculateMoonLatitude - 月球黄纬', () => {
    it('月球黄纬应在 ±5.3° 范围内', () => {
      const lat = calculateMoonLatitude(0, -1);
      // 月球轨道倾角约 5.145°，黄纬最大约 5.3°
      expect(Math.abs(lat)).toBeLessThan((5.5 * Math.PI) / 180);
    });

    it('黄纬应周期性变化', () => {
      // 测试不同时刻的黄纬
      const lat0 = calculateMoonLatitude(0, -1);
      const lat1 = calculateMoonLatitude(0.01, -1);
      const lat2 = calculateMoonLatitude(0.02, -1);
      // 三个时刻黄纬不应完全相同
      expect(lat0 !== lat1 || lat1 !== lat2).toBe(true);
    });
  });

  describe('calculateMoonDistance - 月球距离', () => {
    it('月球平均距离约为 384,400 km', () => {
      const distance = calculateMoonDistance(0, -1);
      // 月球距离在 356,500 - 406,700 km 之间变化
      expect(distance).toBeGreaterThan(356000);
      expect(distance).toBeLessThan(407000);
    });

    it('近地点和远地点距离差异明显', () => {
      // 月球轨道周期约 27.5 天
      // 测试不同时刻的距离变化
      const d0 = calculateMoonDistance(0, -1);
      const d1 = calculateMoonDistance(0.001, -1); // 约 36 天后
      // 距离应有变化
      expect(d0).not.toBe(d1);
    });
  });

  describe('calculateMoonGeocentricCoord - 月球地心坐标', () => {
    it('应返回三元组 [黄经, 黄纬, 距离]', () => {
      const coord = calculateMoonGeocentricCoord(0);
      expect(coord).toHaveLength(3);
      expect(typeof coord[0]).toBe('number');
      expect(typeof coord[1]).toBe('number');
      expect(typeof coord[2]).toBe('number');
    });

    it('坐标分量应与单独计算一致', () => {
      const coord = calculateMoonGeocentricCoord(0, -1, -1, -1);
      const lon = calculateMoonLongitude(0, -1);
      const lat = calculateMoonLatitude(0, -1);
      const dist = calculateMoonDistance(0, -1);

      expect(coord[0]).toBeCloseTo(lon, 10);
      expect(coord[1]).toBeCloseTo(lat, 10);
      expect(coord[2]).toBeCloseTo(dist, 6);
    });
  });

  describe('calculateMoonLongitudeAberration - 月球黄经光行差', () => {
    it('光行差量级约为角秒', () => {
      const aberration = calculateMoonLongitudeAberration(0);
      // 光行差很小，通常在 ±0.03 弧度以内
      expect(Math.abs(aberration)).toBeLessThan(0.1);
    });
  });

  describe('calculateMoonLatitudeAberration - 月球黄纬光行差', () => {
    it('黄纬光行差应很小', () => {
      const lon = calculateMoonLongitude(0, -1);
      const aberration = calculateMoonLatitudeAberration(0, lon);
      // 黄纬光行差很小
      expect(Math.abs(aberration)).toBeLessThan(1 / RAD);
    });
  });

  describe('calculateMoonApparentLongitude - 月球视黄经', () => {
    it('视黄经与几何黄经差异应小于 30 角秒', () => {
      const geoLon = calculateMoonLongitude(0, -1);
      const apparentLon = calculateMoonApparentLongitude(0, -1);
      // 视黄经与几何黄经的差异应小于30角秒
      const diff = Math.abs(apparentLon - geoLon);
      const normalizedDiff = diff > Math.PI ? PI2 - diff : diff;
      expect(normalizedDiff * RAD).toBeLessThan(30);
    });

    it('视黄经应在 0-2π 范围内', () => {
      const apparentLon = calculateMoonApparentLongitude(0.1, -1);
      expect(apparentLon).toBeGreaterThanOrEqual(0);
      expect(apparentLon).toBeLessThan(PI2);
    });
  });

  describe('calculateMoonVelocity - 月球速度', () => {
    it('月球平均角速度约为 8400 弧度/世纪 (约13°/天)', () => {
      const v = calculateMoonVelocity(0);
      // 月球平均角速度约 8399.7 弧度/世纪
      expect(v).toBeGreaterThan(8390);
      expect(v).toBeLessThan(8410);
    });

    it('速度应随时间变化', () => {
      const v0 = calculateMoonVelocity(0);
      const v1 = calculateMoonVelocity(0.01);
      // 由于轨道离心率，速度会变化
      expect(v0).not.toBeCloseTo(v1, 1);
    });
  });

  describe('calculateTimeFromMoonLongitude - 已知黄经求时间', () => {
    it('计算结果应收敛', () => {
      const targetLon = Math.PI; // 180°
      const t = calculateTimeFromMoonLongitude(targetLon);
      // 验证反算结果接近目标黄经
      const calculatedLon = calculateMoonApparentLongitude(t, -1);
      const diff = Math.abs(calculatedLon - targetLon);
      const normalizedDiff = diff > Math.PI ? PI2 - diff : diff;
      // 误差应小于 5 角秒
      expect(normalizedDiff * RAD).toBeLessThan(5);
    });

    it('不同目标黄经应收敛', () => {
      const targets = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (const target of targets) {
        const t = calculateTimeFromMoonLongitude(target);
        const calculated = calculateMoonApparentLongitude(t, -1);
        let diff = Math.abs(calculated - target);
        if (diff > Math.PI) diff = PI2 - diff;
        // 误差应小于 10 角秒 (月球运动快，精度要求可以稍低)
        expect(diff * RAD).toBeLessThan(10);
      }
    });
  });

  describe('calculateMoonApparentCoord - 月球视坐标', () => {
    it('应返回三元组 [视黄经, 视黄纬, 距离]', () => {
      const coord = calculateMoonApparentCoord(0);
      expect(coord).toHaveLength(3);
    });

    it('视黄经应与单独计算一致', () => {
      const coord = calculateMoonApparentCoord(0, -1);
      const apparentLon = calculateMoonApparentLongitude(0, -1);
      expect(coord[0]).toBeCloseTo(apparentLon, 10);
    });
  });

  describe('calculateMoonAngularRadius - 月球视半径', () => {
    it('平均距离时视半径约为 15.5 角分', () => {
      const radius = calculateMoonAngularRadius(MOON_MEAN_DISTANCE);
      // 15.5 角分 ≈ 931 角秒 ≈ 0.00451 弧度
      expect(radius * RAD).toBeCloseTo(MOON_MEAN_ANGULAR_RADIUS, 0);
    });

    it('近地点时视半径更大', () => {
      const nearRadius = calculateMoonAngularRadius(356500);
      const farRadius = calculateMoonAngularRadius(406700);
      expect(nearRadius).toBeGreaterThan(farRadius);
    });
  });

  describe('常量和名称', () => {
    it('MOON_MEAN_DISTANCE 应为 384400 km', () => {
      expect(MOON_MEAN_DISTANCE).toBe(384400);
    });

    it('MOON_MEAN_ANGULAR_RADIUS 应为 931.2 角秒', () => {
      expect(MOON_MEAN_ANGULAR_RADIUS).toBe(931.2);
    });

    it('应有4个月相名称', () => {
      expect(MOON_PHASE_NAMES_CN).toHaveLength(4);
      expect(MOON_PHASE_NAMES_EN).toHaveLength(4);
    });

    it('月相名称正确', () => {
      expect(MOON_PHASE_NAMES_CN[0]).toBe('朔');
      expect(MOON_PHASE_NAMES_CN[2]).toBe('望');
      expect(MOON_PHASE_NAMES_EN[0]).toBe('New Moon');
      expect(MOON_PHASE_NAMES_EN[2]).toBe('Full Moon');
    });
  });
});
