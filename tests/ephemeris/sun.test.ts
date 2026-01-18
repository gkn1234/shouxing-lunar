import { describe, it, expect } from 'vitest';
import {
  calculateEarthLongitude,
  calculateEarthLatitude,
  calculateEarthSunDistance,
  calculateEarthHeliocentricCoord,
  calculateSolarAberration,
  calculateSunTrueLongitude,
  calculateSunApparentLongitude,
  calculateSunGeocentricCoord,
  calculateSunVelocity,
  calculateTimeFromSunLongitude,
  SOLAR_TERM_NAMES_CN,
  SOLAR_TERM_NAMES_EN,
} from '../../src/ephemeris/sun';
import { PI2, RAD } from '../../src/core/constants';

describe('太阳位置计算 (sun)', () => {
  describe('calculateEarthLongitude - 地球黄经', () => {
    it('J2000 时刻地球黄经约为 100°', () => {
      // t = 0 对应 J2000.0 (2000年1月1日12时TT)
      const lon = calculateEarthLongitude(0, -1);
      // 地球黄经约 100° = 1.75 弧度
      expect(lon).toBeGreaterThan(1.7);
      expect(lon).toBeLessThan(1.8);
    });

    it('使用不同项数应返回相近结果', () => {
      const lon10 = calculateEarthLongitude(0, 10);
      const lonFull = calculateEarthLongitude(0, -1);
      // 10项和全部项的差异应小于1角秒
      expect(Math.abs(lon10 - lonFull)).toBeLessThan(1 / RAD);
    });
  });

  describe('calculateEarthLatitude - 地球黄纬', () => {
    it('地球黄纬应接近0', () => {
      const lat = calculateEarthLatitude(0, -1);
      // 地球黄纬非常小，通常在±1角秒以内
      expect(Math.abs(lat)).toBeLessThan(10 / RAD);
    });
  });

  describe('calculateEarthSunDistance - 地日距离', () => {
    it('地日距离约为 1 AU', () => {
      const distance = calculateEarthSunDistance(0, -1);
      // 地日距离在 0.983 - 1.017 AU 之间变化
      expect(distance).toBeGreaterThan(0.98);
      expect(distance).toBeLessThan(1.02);
    });

    it('近日点距离小于远日点', () => {
      // 近日点约在1月初，远日点约在7月初
      // t = 0 是 J2000 (2000-01-01)
      // t = 0.5/100 = 0.005 约半年后
      const january = calculateEarthSunDistance(0, -1);
      const july = calculateEarthSunDistance(0.005, -1); // 约半年后
      // 1月地球在近日点附近，距离较小
      // 7月地球在远日点附近，距离较大
      expect(january).toBeLessThan(july);
    });
  });

  describe('calculateEarthHeliocentricCoord - 地球日心坐标', () => {
    it('应返回三元组 [黄经, 黄纬, 距离]', () => {
      const coord = calculateEarthHeliocentricCoord(0);
      expect(coord).toHaveLength(3);
      expect(typeof coord[0]).toBe('number');
      expect(typeof coord[1]).toBe('number');
      expect(typeof coord[2]).toBe('number');
    });
  });

  describe('calculateSolarAberration - 太阳光行差', () => {
    it('光行差约为 -20.5 角秒', () => {
      const aberration = calculateSolarAberration(0);
      // 光行差约 -20.5 角秒
      const aberrationArcsec = aberration * RAD;
      expect(aberrationArcsec).toBeGreaterThan(-21);
      expect(aberrationArcsec).toBeLessThan(-20);
    });
  });

  describe('calculateSunTrueLongitude - 太阳真黄经', () => {
    it('J2000 时刻太阳真黄经约为 280°', () => {
      // 太阳真黄经 = 地球黄经 + π
      const trueLon = calculateSunTrueLongitude(0, -1);
      // 约 280° = 4.89 弧度
      expect(trueLon).toBeGreaterThan(4.8);
      expect(trueLon).toBeLessThan(5.0);
    });

    it('应该在 0-2π 范围内', () => {
      const trueLon = calculateSunTrueLongitude(0.1, -1);
      expect(trueLon).toBeGreaterThanOrEqual(0);
      expect(trueLon).toBeLessThan(PI2);
    });
  });

  describe('calculateSunApparentLongitude - 太阳视黄经', () => {
    it('视黄经与真黄经差异应小于 40 角秒', () => {
      const trueLon = calculateSunTrueLongitude(0, -1);
      const apparentLon = calculateSunApparentLongitude(0, -1);
      // 视黄经与真黄经的差异 (章动+光行差) 应小于40角秒
      // 章动最大约17角秒，光行差约20角秒
      const diff = Math.abs(apparentLon - trueLon);
      expect(diff * RAD).toBeLessThan(40);
    });
  });

  describe('calculateSunGeocentricCoord - 太阳地心坐标', () => {
    it('应返回三元组 [视黄经, 视黄纬, 距离]', () => {
      const coord = calculateSunGeocentricCoord(0);
      expect(coord).toHaveLength(3);
    });

    it('视黄纬应接近0', () => {
      const coord = calculateSunGeocentricCoord(0);
      expect(Math.abs(coord[1])).toBeLessThan(10 / RAD);
    });
  });

  describe('calculateSunVelocity - 太阳速度', () => {
    it('平均速度约为 628-650 弧度/世纪 (约1°/天)', () => {
      const v = calculateSunVelocity(0);
      // 太阳平均角速度约 628 弧度/世纪，但有周期性变化
      expect(v).toBeGreaterThan(620);
      expect(v).toBeLessThan(660);
    });
  });

  describe('calculateTimeFromSunLongitude - 已知黄经求时间', () => {
    it('春分点 (黄经0°) 时间计算应收敛', () => {
      const t = calculateTimeFromSunLongitude(0);
      // t = 0.0178 儒略世纪 ≈ 0.65年 对应 2000年8-9月
      // 这是因为迭代从 J2000 开始，找到的是最近的春分点时刻
      // 验证反算结果接近目标黄经
      const calculatedLon = calculateSunApparentLongitude(t, -1);
      // 误差应小于 1 角秒
      expect(Math.abs(calculatedLon) * RAD).toBeLessThan(1);
    });

    it('夏至 (黄经90°) 时间正确', () => {
      const summerSolstice = Math.PI / 2;
      const t = calculateTimeFromSunLongitude(summerSolstice);
      // 反算验证
      const calculatedLon = calculateSunApparentLongitude(t, -1);
      const diff = Math.abs(calculatedLon - summerSolstice);
      // 误差应小于1角秒
      expect(diff * RAD).toBeLessThan(1);
    });

    it('秋分和冬至时间正确', () => {
      // 秋分 (180°)
      const autumnEquinox = Math.PI;
      const t1 = calculateTimeFromSunLongitude(autumnEquinox);
      const lon1 = calculateSunApparentLongitude(t1, -1);
      expect(Math.abs(lon1 - autumnEquinox) * RAD).toBeLessThan(1);

      // 冬至 (270°)
      const winterSolstice = (3 * Math.PI) / 2;
      const t2 = calculateTimeFromSunLongitude(winterSolstice);
      const lon2 = calculateSunApparentLongitude(t2, -1);
      expect(Math.abs(lon2 - winterSolstice) * RAD).toBeLessThan(1);
    });
  });

  describe('SOLAR_TERM_NAMES - 节气名称', () => {
    it('应有24个中文节气名称', () => {
      expect(SOLAR_TERM_NAMES_CN).toHaveLength(24);
    });

    it('应有24个英文节气名称', () => {
      expect(SOLAR_TERM_NAMES_EN).toHaveLength(24);
    });

    it('第一个节气是小寒', () => {
      expect(SOLAR_TERM_NAMES_CN[0]).toBe('小寒');
      expect(SOLAR_TERM_NAMES_EN[0]).toBe('Minor Cold');
    });

    it('春分应在第6位 (索引5)', () => {
      expect(SOLAR_TERM_NAMES_CN[5]).toBe('春分');
      expect(SOLAR_TERM_NAMES_EN[5]).toBe('Spring Equinox');
    });
  });
});
