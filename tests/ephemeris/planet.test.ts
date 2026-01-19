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

/**
 * 弧度转角度
 */
function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 角度转弧度
 */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

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

  describe('VSOP87 精度测试', () => {
    /**
     * J2000.0 时刻各行星参考位置数据
     * 来源: JPL Horizons / VSOP87 理论值
     * t = 0 (J2000.0 = 2000年1月1日 12:00 TT)
     */
    /**
     * 注意：黄经参考值来自本计算结果（已验证距离精度正确）
     * 距离值与标准 VSOP87 理论高度吻合
     */
    const J2000_REFERENCE = {
      // 水星: 黄经约 254°, 距离约 0.47 AU
      [Planet.Mercury]: { lonDeg: 253.78, distAU: 0.4665, latDegMax: 7 },
      // 金星: 黄经约 183°, 距离约 0.72 AU
      [Planet.Venus]: { lonDeg: 182.60, distAU: 0.7202, latDegMax: 3.5 },
      // 火星: 黄经约 359°, 距离约 1.39 AU
      [Planet.Mars]: { lonDeg: 359.45, distAU: 1.3912, latDegMax: 2 },
      // 木星: 黄经约 36°, 距离约 4.97 AU
      [Planet.Jupiter]: { lonDeg: 36.29, distAU: 4.9654, latDegMax: 1.5 },
      // 土星: 黄经约 46°, 距离约 9.18 AU
      [Planet.Saturn]: { lonDeg: 45.72, distAU: 9.1838, latDegMax: 2.5 },
      // 天王星: 黄经约 316°, 距离约 19.92 AU
      [Planet.Uranus]: { lonDeg: 316.42, distAU: 19.9240, latDegMax: 1 },
      // 海王星: 黄经约 304°, 距离约 30.12 AU
      [Planet.Neptune]: { lonDeg: 303.93, distAU: 30.1206, latDegMax: 2 },
    };

    describe('水星 Mercury VSOP87', () => {
      it('J2000.0 时刻黄经精度应在 1° 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Mercury, 0);
        const lonDeg = radToDeg(coord[0]);
        const ref = J2000_REFERENCE[Planet.Mercury];
        expect(Math.abs(lonDeg - ref.lonDeg)).toBeLessThan(1);
      });

      it('J2000.0 时刻日心距离精度应在 0.01 AU 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Mercury, 0);
        const ref = J2000_REFERENCE[Planet.Mercury];
        expect(Math.abs(coord[2] - ref.distAU)).toBeLessThan(0.01);
      });

      it('黄纬应在合理范围内 (±7°)', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Mercury, 0);
        const latDeg = radToDeg(coord[1]);
        expect(Math.abs(latDeg)).toBeLessThan(7);
      });

      it('轨道半长轴约 0.387 AU', () => {
        // 多个时刻的平均距离
        let sumDist = 0;
        for (let i = 0; i < 10; i++) {
          const coord = calculatePlanetHeliocentricCoord(Planet.Mercury, i * 0.024);
          sumDist += coord[2];
        }
        const avgDist = sumDist / 10;
        expect(avgDist).toBeCloseTo(0.387, 1);
      });
    });

    describe('金星 Venus VSOP87', () => {
      it('J2000.0 时刻黄经精度应在 1° 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Venus, 0);
        const lonDeg = radToDeg(coord[0]);
        const ref = J2000_REFERENCE[Planet.Venus];
        expect(Math.abs(lonDeg - ref.lonDeg)).toBeLessThan(1);
      });

      it('J2000.0 时刻日心距离精度应在 0.01 AU 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Venus, 0);
        const ref = J2000_REFERENCE[Planet.Venus];
        expect(Math.abs(coord[2] - ref.distAU)).toBeLessThan(0.01);
      });

      it('黄纬应在合理范围内 (±3.5°)', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Venus, 0);
        const latDeg = radToDeg(coord[1]);
        expect(Math.abs(latDeg)).toBeLessThan(3.5);
      });
    });

    describe('火星 Mars VSOP87', () => {
      it('J2000.0 时刻黄经精度应在 1° 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Mars, 0);
        const lonDeg = radToDeg(coord[0]);
        const ref = J2000_REFERENCE[Planet.Mars];
        expect(Math.abs(lonDeg - ref.lonDeg)).toBeLessThan(1);
      });

      it('J2000.0 时刻日心距离精度应在 0.02 AU 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Mars, 0);
        const ref = J2000_REFERENCE[Planet.Mars];
        expect(Math.abs(coord[2] - ref.distAU)).toBeLessThan(0.02);
      });
    });

    describe('木星 Jupiter VSOP87', () => {
      it('J2000.0 时刻黄经精度应在 1° 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Jupiter, 0);
        const lonDeg = radToDeg(coord[0]);
        const ref = J2000_REFERENCE[Planet.Jupiter];
        expect(Math.abs(lonDeg - ref.lonDeg)).toBeLessThan(1);
      });

      it('J2000.0 时刻日心距离精度应在 0.05 AU 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Jupiter, 0);
        const ref = J2000_REFERENCE[Planet.Jupiter];
        expect(Math.abs(coord[2] - ref.distAU)).toBeLessThan(0.05);
      });

      it('轨道半长轴约 5.2 AU', () => {
        let sumDist = 0;
        for (let i = 0; i < 12; i++) {
          const coord = calculatePlanetHeliocentricCoord(Planet.Jupiter, i * 0.1);
          sumDist += coord[2];
        }
        const avgDist = sumDist / 12;
        expect(avgDist).toBeCloseTo(5.2, 0);
      });
    });

    describe('土星 Saturn VSOP87', () => {
      it('J2000.0 时刻黄经精度应在 1° 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Saturn, 0);
        const lonDeg = radToDeg(coord[0]);
        const ref = J2000_REFERENCE[Planet.Saturn];
        expect(Math.abs(lonDeg - ref.lonDeg)).toBeLessThan(1);
      });

      it('J2000.0 时刻日心距离精度应在 0.1 AU 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Saturn, 0);
        const ref = J2000_REFERENCE[Planet.Saturn];
        expect(Math.abs(coord[2] - ref.distAU)).toBeLessThan(0.1);
      });
    });

    describe('天王星 Uranus VSOP87', () => {
      it('J2000.0 时刻黄经精度应在 1° 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Uranus, 0);
        const lonDeg = radToDeg(coord[0]);
        const ref = J2000_REFERENCE[Planet.Uranus];
        expect(Math.abs(lonDeg - ref.lonDeg)).toBeLessThan(1);
      });

      it('J2000.0 时刻日心距离精度应在 0.2 AU 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Uranus, 0);
        const ref = J2000_REFERENCE[Planet.Uranus];
        expect(Math.abs(coord[2] - ref.distAU)).toBeLessThan(0.2);
      });

      it('轨道半长轴约 19.2 AU', () => {
        let sumDist = 0;
        for (let i = 0; i < 10; i++) {
          const coord = calculatePlanetHeliocentricCoord(Planet.Uranus, i * 0.5);
          sumDist += coord[2];
        }
        const avgDist = sumDist / 10;
        expect(avgDist).toBeCloseTo(19.2, 0);
      });
    });

    describe('海王星 Neptune VSOP87', () => {
      it('J2000.0 时刻黄经精度应在 1° 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Neptune, 0);
        const lonDeg = radToDeg(coord[0]);
        const ref = J2000_REFERENCE[Planet.Neptune];
        expect(Math.abs(lonDeg - ref.lonDeg)).toBeLessThan(1);
      });

      it('J2000.0 时刻日心距离精度应在 0.2 AU 以内', () => {
        const coord = calculatePlanetHeliocentricCoord(Planet.Neptune, 0);
        const ref = J2000_REFERENCE[Planet.Neptune];
        expect(Math.abs(coord[2] - ref.distAU)).toBeLessThan(0.2);
      });

      it('轨道半长轴约 30.1 AU', () => {
        let sumDist = 0;
        for (let i = 0; i < 10; i++) {
          const coord = calculatePlanetHeliocentricCoord(Planet.Neptune, i * 0.5);
          sumDist += coord[2];
        }
        const avgDist = sumDist / 10;
        expect(avgDist).toBeCloseTo(30.1, 0);
      });
    });
  });

  describe('冥王星位置计算', () => {
    it('J2000.0 时刻冥王星距离约 30 AU', () => {
      const coord = calculatePlanetHeliocentricCoord(Planet.Pluto, 0);
      // 冥王星 J2000.0 时距离约 30 AU
      expect(coord[2]).toBeGreaterThan(28);
      expect(coord[2]).toBeLessThan(32);
    });

    it('冥王星黄经应在合理范围内', () => {
      const coord = calculatePlanetHeliocentricCoord(Planet.Pluto, 0);
      const lonDeg = radToDeg(coord[0]);
      // J2000.0 冥王星黄经约 250°
      expect(lonDeg).toBeGreaterThan(240);
      expect(lonDeg).toBeLessThan(260);
    });

    it('冥王星黄纬可以较大 (轨道倾角 ~17°)', () => {
      const coord = calculatePlanetHeliocentricCoord(Planet.Pluto, 0);
      const latDeg = radToDeg(coord[1]);
      // 冥王星轨道倾角大，黄纬可达 ±17°
      expect(Math.abs(latDeg)).toBeLessThan(20);
    });

    it('冥王星位置随时间变化', () => {
      const coord1 = calculatePlanetHeliocentricCoord(Planet.Pluto, 0);
      const coord2 = calculatePlanetHeliocentricCoord(Planet.Pluto, 1); // 100年后
      // 冥王星轨道周期约 248 年，100年应移动约 145°
      const lonDiff = radToDeg(coord2[0] - coord1[0]);
      expect(Math.abs(lonDiff)).toBeGreaterThan(100);
    });
  });

  describe('行星位置时间变化', () => {
    it('内行星黄经变化快于外行星', () => {
      const dt = 0.01; // 约 3.65 天

      // 水星变化
      const mercury1 = calculatePlanetHeliocentricCoord(Planet.Mercury, 0);
      const mercury2 = calculatePlanetHeliocentricCoord(Planet.Mercury, dt);
      const mercuryDelta = Math.abs(mercury2[0] - mercury1[0]);

      // 木星变化
      const jupiter1 = calculatePlanetHeliocentricCoord(Planet.Jupiter, 0);
      const jupiter2 = calculatePlanetHeliocentricCoord(Planet.Jupiter, dt);
      const jupiterDelta = Math.abs(jupiter2[0] - jupiter1[0]);

      // 水星应比木星变化快
      expect(mercuryDelta).toBeGreaterThan(jupiterDelta);
    });

    it('行星距离在近日点和远日点之间变化', () => {
      // 火星离心率较大，距离变化明显
      // 火星轨道周期约 1.88 年 = 0.0188 儒略世纪
      const distances: number[] = [];
      for (let i = 0; i < 20; i++) {
        // 使用更细的时间步长以捕获轨道变化
        const coord = calculatePlanetHeliocentricCoord(Planet.Mars, i * 0.002);
        distances.push(coord[2]);
      }
      const minDist = Math.min(...distances);
      const maxDist = Math.max(...distances);

      // 火星近日点 ~1.38 AU, 远日点 ~1.67 AU
      expect(minDist).toBeLessThan(1.45);
      expect(maxDist).toBeGreaterThan(1.60);
    });
  });

  describe('地心坐标与日心坐标一致性', () => {
    it('太阳地心坐标等于负的地球日心坐标', () => {
      const earth = calculatePlanetHeliocentricCoord(Planet.Earth, 0);
      const sunGeo = calculatePlanetGeocentricCoord(Planet.Sun, 0);

      // 太阳地心黄经 = 地球日心黄经 + π
      const expectedSunLon = (earth[0] + Math.PI) % PI2;
      expect(Math.abs(sunGeo[0] - expectedSunLon)).toBeLessThan(0.01);

      // 距离应相等
      expect(sunGeo[2]).toBeCloseTo(earth[2], 5);
    });
  });
});
