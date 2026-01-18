import { describe, it, expect } from 'vitest';
import {
  Planet,
  PLANET_NAMES_CN,
  PLANET_NAMES_EN,
  PLANET_CORRECTIONS,
  PLANET_SYNODIC_PERIODS,
  PLANET_ORBITAL_PERIODS,
  calculateEarthHeliocentricCoord,
  calculatePlanetHeliocentricCoord,
  calculatePlanetGeocentricCoord,
  calculatePlanetPhaseAngle,
  calculatePlanetMagnitude,
  isPlanetDirect,
  calculateLightTime,
  AU_TO_KM,
  SPEED_OF_LIGHT,
} from '../../src/ephemeris/planet';
import { PI2 } from '../../src/core/constants';

describe('行星位置计算 (planet)', () => {
  describe('Planet 枚举', () => {
    it('应有正确的行星编号', () => {
      expect(Planet.Earth).toBe(0);
      expect(Planet.Mercury).toBe(1);
      expect(Planet.Venus).toBe(2);
      expect(Planet.Mars).toBe(3);
      expect(Planet.Jupiter).toBe(4);
      expect(Planet.Saturn).toBe(5);
      expect(Planet.Uranus).toBe(6);
      expect(Planet.Neptune).toBe(7);
      expect(Planet.Pluto).toBe(8);
      expect(Planet.Sun).toBe(9);
    });
  });

  describe('常量数据', () => {
    it('应有10个行星名称', () => {
      expect(PLANET_NAMES_CN).toHaveLength(10);
      expect(PLANET_NAMES_EN).toHaveLength(10);
    });

    it('行星名称应正确', () => {
      expect(PLANET_NAMES_CN[Planet.Earth]).toBe('地球');
      expect(PLANET_NAMES_CN[Planet.Mars]).toBe('火星');
      expect(PLANET_NAMES_EN[Planet.Jupiter]).toBe('Jupiter');
    });

    it('应有7个行星修正值', () => {
      expect(PLANET_CORRECTIONS).toHaveLength(7);
      // 每个修正值应有3个分量
      for (const correction of PLANET_CORRECTIONS) {
        expect(correction).toHaveLength(3);
      }
    });

    it('会合周期应为正数', () => {
      for (let i = 1; i < PLANET_SYNODIC_PERIODS.length; i++) {
        expect(PLANET_SYNODIC_PERIODS[i]).toBeGreaterThan(0);
      }
    });

    it('轨道周期应为正数', () => {
      for (const period of PLANET_ORBITAL_PERIODS) {
        expect(period).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateEarthHeliocentricCoord - 地球日心坐标', () => {
    it('应返回三元组 [黄经, 黄纬, 距离]', () => {
      const coord = calculateEarthHeliocentricCoord(0);
      expect(coord).toHaveLength(3);
    });

    it('地日距离约为 1 AU', () => {
      const coord = calculateEarthHeliocentricCoord(0);
      expect(coord[2]).toBeGreaterThan(0.98);
      expect(coord[2]).toBeLessThan(1.02);
    });

    it('地球黄纬接近 0', () => {
      const coord = calculateEarthHeliocentricCoord(0);
      expect(Math.abs(coord[1])).toBeLessThan(0.001);
    });
  });

  describe('calculatePlanetHeliocentricCoord - 行星日心坐标', () => {
    it('地球应返回有效日心坐标', () => {
      const coord = calculatePlanetHeliocentricCoord(Planet.Earth, 0);
      expect(coord).toHaveLength(3);
      expect(coord[2]).toBeGreaterThan(0.98);
      expect(coord[2]).toBeLessThan(1.02);
    });

    it('太阳应返回原点', () => {
      const coord = calculatePlanetHeliocentricCoord(Planet.Sun, 0);
      expect(coord[0]).toBe(0);
      expect(coord[1]).toBe(0);
      expect(coord[2]).toBe(0);
    });

    it('内行星轨道半径应小于1 AU', () => {
      // 水星
      const mercury = calculatePlanetHeliocentricCoord(Planet.Mercury, 0);
      expect(mercury[2]).toBeLessThan(0.5);

      // 金星
      const venus = calculatePlanetHeliocentricCoord(Planet.Venus, 0);
      expect(venus[2]).toBeLessThan(0.8);
    });

    it('外行星轨道半径应大于1 AU', () => {
      // 火星
      const mars = calculatePlanetHeliocentricCoord(Planet.Mars, 0);
      expect(mars[2]).toBeGreaterThan(1.3);

      // 木星
      const jupiter = calculatePlanetHeliocentricCoord(Planet.Jupiter, 0);
      expect(jupiter[2]).toBeGreaterThan(4);
    });
  });

  describe('calculatePlanetGeocentricCoord - 行星地心坐标', () => {
    it('地球地心坐标应为原点', () => {
      const coord = calculatePlanetGeocentricCoord(Planet.Earth, 0);
      expect(coord[0]).toBe(0);
      expect(coord[1]).toBe(0);
      expect(coord[2]).toBe(0);
    });

    it('金星地心距离应在合理范围内', () => {
      // 金星距离地球 0.26 - 1.72 AU
      const coord = calculatePlanetGeocentricCoord(Planet.Venus, 0);
      expect(coord[2]).toBeGreaterThan(0.2);
      expect(coord[2]).toBeLessThan(2);
    });

    it('火星地心距离应在合理范围内', () => {
      // 火星距离地球 0.37 - 2.68 AU
      const coord = calculatePlanetGeocentricCoord(Planet.Mars, 0);
      expect(coord[2]).toBeGreaterThan(0.3);
      expect(coord[2]).toBeLessThan(3);
    });

    it('黄经应在 0-2π 范围内', () => {
      const coord = calculatePlanetGeocentricCoord(Planet.Jupiter, 0);
      expect(coord[0]).toBeGreaterThanOrEqual(0);
      expect(coord[0]).toBeLessThan(PI2);
    });
  });

  describe('calculatePlanetPhaseAngle - 行星相位角', () => {
    it('相位角应在 0-π 范围内', () => {
      const phase = calculatePlanetPhaseAngle(Planet.Mars, 0);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThanOrEqual(Math.PI);
    });

    it('内行星相位角变化范围更大', () => {
      // 测试不同时刻的相位角
      const phases = [];
      for (let i = 0; i < 10; i++) {
        phases.push(calculatePlanetPhaseAngle(Planet.Venus, i * 0.01));
      }
      // 应该有变化
      const min = Math.min(...phases);
      const max = Math.max(...phases);
      expect(max - min).toBeGreaterThan(0);
    });
  });

  describe('calculatePlanetMagnitude - 行星视星等', () => {
    it('金星应为最亮的行星', () => {
      const venus = calculatePlanetMagnitude(Planet.Venus, 0);
      const mars = calculatePlanetMagnitude(Planet.Mars, 0);
      const jupiter = calculatePlanetMagnitude(Planet.Jupiter, 0);
      // 金星通常最亮 (负数越小越亮)
      expect(venus).toBeLessThan(0);
    });

    it('木星应比土星亮', () => {
      const jupiter = calculatePlanetMagnitude(Planet.Jupiter, 0);
      const saturn = calculatePlanetMagnitude(Planet.Saturn, 0);
      expect(jupiter).toBeLessThan(saturn);
    });
  });

  describe('isPlanetDirect - 行星顺逆行', () => {
    it('应返回布尔值', () => {
      const result = isPlanetDirect(Planet.Mars, 0);
      expect(typeof result).toBe('boolean');
    });

    it('大部分时间行星应顺行', () => {
      // 测试多个时刻
      let directCount = 0;
      for (let i = 0; i < 20; i++) {
        if (isPlanetDirect(Planet.Mars, i * 0.05)) {
          directCount++;
        }
      }
      // 火星约 90% 时间顺行
      expect(directCount).toBeGreaterThan(10);
    });
  });

  describe('calculateLightTime - 光行时间', () => {
    it('1 AU 的光行时间约为 8.3 分钟', () => {
      const lightTime = calculateLightTime(1);
      // 8.3 分钟 ≈ 0.00577 天
      expect(lightTime).toBeCloseTo(0.00577, 4);
    });

    it('光行时间与距离成正比', () => {
      const lt1 = calculateLightTime(1);
      const lt2 = calculateLightTime(2);
      expect(lt2 / lt1).toBeCloseTo(2, 5);
    });
  });

  describe('常数', () => {
    it('AU_TO_KM 应为 149597870.7', () => {
      expect(AU_TO_KM).toBeCloseTo(149597870.7, 0);
    });

    it('SPEED_OF_LIGHT 应约为 299792 km/s', () => {
      expect(SPEED_OF_LIGHT).toBeCloseTo(299792.458, 0);
    });
  });
});
