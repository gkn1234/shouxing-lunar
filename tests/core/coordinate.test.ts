import { describe, it, expect } from 'vitest';
import {
  normalizeAngle,
  normalizeAngleSigned,
  mod2,
  sphericalToRectangular,
  rectangularToSpherical,
  rotateSpherical,
  eclipticToEquatorial,
  equatorialToEcliptic,
  equatorialToHorizontal,
  angularDistance,
  heliocentricToGeocentric,
} from '../../src/core/coordinate';
import { PI2, PI_2 } from '../../src/core/constants';

describe('坐标系转换 (coordinate)', () => {
  describe('normalizeAngle - 角度规范化到 0-2π', () => {
    it('正常角度应该不变', () => {
      expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI, 10);
    });

    it('负角度应该转为正', () => {
      expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(3 * Math.PI / 2, 10);
    });

    it('大于 2π 的角度应该取模', () => {
      expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 10);
    });
  });

  describe('normalizeAngleSigned - 角度规范化到 -π 到 π', () => {
    it('小角度应该不变', () => {
      expect(normalizeAngleSigned(Math.PI / 4)).toBeCloseTo(Math.PI / 4, 10);
    });

    it('大于 π 的角度应该转为负', () => {
      expect(normalizeAngleSigned(3 * Math.PI / 2)).toBeCloseTo(-Math.PI / 2, 10);
    });
  });

  describe('mod2 - 临界余数', () => {
    it('正常情况', () => {
      expect(mod2(7, 5)).toBeCloseTo(2, 10);
    });

    it('超过一半应该返回负值', () => {
      expect(mod2(8, 5)).toBeCloseTo(-2, 10);
    });
  });

  describe('球面/直角坐标转换', () => {
    it('sphericalToRectangular 应该正确转换', () => {
      // 在 x 轴上的点 (0, 0, 1)
      const rect = sphericalToRectangular([0, 0, 1]);
      expect(rect[0]).toBeCloseTo(1, 10);
      expect(rect[1]).toBeCloseTo(0, 10);
      expect(rect[2]).toBeCloseTo(0, 10);
    });

    it('rectangularToSpherical 应该正确转换', () => {
      const sph = rectangularToSpherical([1, 0, 0]);
      expect(sph[0]).toBeCloseTo(0, 10); // 经度 0
      expect(sph[1]).toBeCloseTo(0, 10); // 纬度 0
      expect(sph[2]).toBeCloseTo(1, 10); // 距离 1
    });

    it('往返转换应该保持一致', () => {
      const original: [number, number, number] = [Math.PI / 4, Math.PI / 6, 2.5];
      const rect = sphericalToRectangular(original);
      const result = rectangularToSpherical(rect);
      expect(result[0]).toBeCloseTo(original[0], 10);
      expect(result[1]).toBeCloseTo(original[1], 10);
      expect(result[2]).toBeCloseTo(original[2], 10);
    });
  });

  describe('rotateSpherical - 球面旋转', () => {
    it('零旋转应该保持不变', () => {
      const coord: [number, number, number] = [Math.PI / 4, Math.PI / 6, 1];
      const result = rotateSpherical(coord, 0);
      expect(result[0]).toBeCloseTo(coord[0], 10);
      expect(result[1]).toBeCloseTo(coord[1], 10);
    });
  });

  describe('黄道/赤道坐标转换', () => {
    const epsilon = 23.4 * Math.PI / 180; // 黄赤交角约23.4度

    it('eclipticToEquatorial 春分点应该在赤道上', () => {
      // 春分点: 黄经=0, 黄纬=0
      const ecliptic: [number, number, number] = [0, 0, 1];
      const equatorial = eclipticToEquatorial(ecliptic, epsilon);
      expect(equatorial[0]).toBeCloseTo(0, 5); // 赤经 0
      expect(equatorial[1]).toBeCloseTo(0, 5); // 赤纬 0
    });

    it('夏至点赤纬应该等于黄赤交角', () => {
      // 夏至点: 黄经=90度
      const ecliptic: [number, number, number] = [Math.PI / 2, 0, 1];
      const equatorial = eclipticToEquatorial(ecliptic, epsilon);
      expect(equatorial[1]).toBeCloseTo(epsilon, 5); // 赤纬 ≈ ε
    });

    it('往返转换应该保持一致', () => {
      const original: [number, number, number] = [Math.PI / 3, Math.PI / 12, 1];
      const equatorial = eclipticToEquatorial(original, epsilon);
      const result = equatorialToEcliptic(equatorial, epsilon);
      expect(result[0]).toBeCloseTo(original[0], 5);
      expect(result[1]).toBeCloseTo(original[1], 5);
    });
  });

  describe('equatorialToHorizontal - 赤道转地平', () => {
    it('天顶的赤纬应该等于观测点纬度', () => {
      const latitude = 40 * Math.PI / 180; // 北纬40度
      const longitude = 0;
      const gst = 0;
      // 天顶: 赤经=LST, 赤纬=纬度
      const equatorial: [number, number, number] = [gst + longitude, latitude, 1];
      const horizontal = equatorialToHorizontal(equatorial, longitude, latitude, gst);
      expect(horizontal[1]).toBeCloseTo(PI_2, 1); // 高度角 90度
    });
  });

  describe('angularDistance - 角距离', () => {
    it('同一点的角距离应该为 0', () => {
      const dist = angularDistance(0, 0, 0, 0);
      expect(dist).toBeCloseTo(0, 10);
    });

    it('相对的点角距离应该为 π', () => {
      const dist = angularDistance(0, 0, Math.PI, 0);
      expect(dist).toBeCloseTo(Math.PI, 10);
    });

    it('北极到赤道的角距离应该为 π/2', () => {
      const dist = angularDistance(0, Math.PI / 2, 0, 0);
      expect(dist).toBeCloseTo(Math.PI / 2, 10);
    });
  });

  describe('heliocentricToGeocentric - 日心转地心', () => {
    it('地球位置转换后应该在原点', () => {
      const earth: [number, number, number] = [0, 0, 1];
      const result = heliocentricToGeocentric(earth, earth);
      expect(result[2]).toBeCloseTo(0, 10); // 距离为 0
    });

    it('太阳在地心坐标系中应该在地球的对面', () => {
      const earth: [number, number, number] = [0, 0, 1]; // 地球在 x 方向
      const sun: [number, number, number] = [0, 0, 0]; // 太阳在原点 (距离为0表示在原点)
      // 由于太阳在原点，地球在 (1,0,0)，所以从地球看太阳应该在 (-1,0,0) 方向
      // 即黄经 = π
      const result = heliocentricToGeocentric(sun, earth);
      expect(result[0]).toBeCloseTo(Math.PI, 5);
    });
  });
});
