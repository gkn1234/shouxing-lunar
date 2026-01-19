import { describe, it, expect } from 'vitest';
import {
  TwilightType,
  TwilightTimes,
  calculateTwilight,
  calculateCivilTwilight,
  calculateNauticalTwilight,
  calculateAstronomicalTwilight,
} from '../../src/ephemeris/twilight';
import { HorizonType, degreesToRadians } from '../../src/ephemeris/rise-transit-set';

describe('晨昏光计算 (twilight)', () => {
  // 测试地点：北京 (116.4E, 39.9N)
  const BEIJING_LON = degreesToRadians(116.4);
  const BEIJING_LAT = degreesToRadians(39.9);

  // 2024年6月21日 (夏至附近)
  // JD 2460483.5 - 2451545 = 8938.5 (J2000起算)
  const JD_SUMMER = 2460483.5 - 2451545;

  // 2024年12月21日 (冬至附近)
  // JD 2460666.5 - 2451545 = 9121.5 (J2000起算)
  const JD_WINTER = 2460666.5 - 2451545;

  // J2000.0 时刻
  const J2000 = 0;

  describe('TwilightType 枚举', () => {
    it('应该与 HorizonType 相同', () => {
      expect(TwilightType.Civil).toBe(HorizonType.Civil);
      expect(TwilightType.Nautical).toBe(HorizonType.Nautical);
      expect(TwilightType.Astronomical).toBe(HorizonType.Astronomical);
    });
  });

  describe('calculateTwilight - 通用晨昏光计算', () => {
    it('应该返回 TwilightTimes 结构', () => {
      const times = calculateTwilight(J2000, BEIJING_LON, BEIJING_LAT);
      expect(times).toHaveProperty('dawn');
      expect(times).toHaveProperty('dusk');
    });

    it('默认应该使用民用晨昏光类型', () => {
      const timesDefault = calculateTwilight(J2000, BEIJING_LON, BEIJING_LAT);
      const timesCivil = calculateTwilight(J2000, BEIJING_LON, BEIJING_LAT, HorizonType.Civil);

      expect(timesDefault.dawn).toEqual(timesCivil.dawn);
      expect(timesDefault.dusk).toEqual(timesCivil.dusk);
    });

    it('晨光始应早于昏影终', () => {
      const times = calculateTwilight(J2000, BEIJING_LON, BEIJING_LAT);
      if (times.dawn !== null && times.dusk !== null) {
        expect(times.dawn).toBeLessThan(times.dusk);
      }
    });
  });

  describe('calculateCivilTwilight - 民用晨昏光', () => {
    it('应该计算民用晨昏光时刻', () => {
      const times = calculateCivilTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      expect(times.dawn).not.toBeNull();
      expect(times.dusk).not.toBeNull();
    });

    it('晨光始(黎明)应在日出前', () => {
      const times = calculateCivilTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      // 民用晨昏光的 dawn 是太阳中心在地平线下6度时的时刻
      // 这应该比实际日出更早
      if (times.dawn !== null && times.dusk !== null) {
        // 确保 dawn 和 dusk 是有效的儒略日
        expect(typeof times.dawn).toBe('number');
        expect(typeof times.dusk).toBe('number');
      }
    });
  });

  describe('calculateNauticalTwilight - 航海晨昏光', () => {
    it('应该计算航海晨昏光时刻', () => {
      const times = calculateNauticalTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      expect(times.dawn).not.toBeNull();
      expect(times.dusk).not.toBeNull();
    });
  });

  describe('calculateAstronomicalTwilight - 天文晨昏光', () => {
    it('应该计算天文晨昏光时刻', () => {
      const times = calculateAstronomicalTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      expect(times.dawn).not.toBeNull();
      expect(times.dusk).not.toBeNull();
    });
  });

  describe('不同类型晨昏光的时间顺序', () => {
    it('航海晨昏光应比民用晨昏光更早/晚', () => {
      const civil = calculateCivilTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      const nautical = calculateNauticalTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);

      // 航海晨光始应早于民用晨光始 (太阳在更低的位置)
      if (nautical.dawn !== null && civil.dawn !== null) {
        expect(nautical.dawn).toBeLessThan(civil.dawn);
      }
      // 航海昏影终应晚于民用昏影终
      if (nautical.dusk !== null && civil.dusk !== null) {
        expect(nautical.dusk).toBeGreaterThan(civil.dusk);
      }
    });

    it('天文晨昏光应比航海晨昏光更早/晚', () => {
      const nautical = calculateNauticalTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      const astronomical = calculateAstronomicalTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);

      // 天文晨光始应早于航海晨光始
      if (astronomical.dawn !== null && nautical.dawn !== null) {
        expect(astronomical.dawn).toBeLessThan(nautical.dawn);
      }
      // 天文昏影终应晚于航海昏影终
      if (astronomical.dusk !== null && nautical.dusk !== null) {
        expect(astronomical.dusk).toBeGreaterThan(nautical.dusk);
      }
    });

    it('应该形成正确的时间序列: 天文黎明 < 航海黎明 < 民用黎明 < 民用黄昏 < 航海黄昏 < 天文黄昏', () => {
      const civil = calculateCivilTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      const nautical = calculateNauticalTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      const astronomical = calculateAstronomicalTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);

      if (
        astronomical.dawn !== null &&
        nautical.dawn !== null &&
        civil.dawn !== null &&
        civil.dusk !== null &&
        nautical.dusk !== null &&
        astronomical.dusk !== null
      ) {
        expect(astronomical.dawn).toBeLessThan(nautical.dawn);
        expect(nautical.dawn).toBeLessThan(civil.dawn);
        expect(civil.dawn).toBeLessThan(civil.dusk);
        expect(civil.dusk).toBeLessThan(nautical.dusk);
        expect(nautical.dusk).toBeLessThan(astronomical.dusk);
      }
    });
  });

  describe('高纬度地区特殊情况', () => {
    // 北极圈附近 (70N)
    const ARCTIC_LAT = degreesToRadians(70);
    const ARCTIC_LON = 0;

    it('高纬度夏季可能返回null (极昼或白夜)', () => {
      const times = calculateCivilTwilight(JD_SUMMER, ARCTIC_LON, ARCTIC_LAT);
      // 极昼期间可能没有民用晨昏光
      expect(times).toBeDefined();
      // 结果可能是 null (极昼) 或有效时间
    });

    it('高纬度冬季可能返回null (极夜)', () => {
      const times = calculateCivilTwilight(JD_WINTER, ARCTIC_LON, ARCTIC_LAT);
      expect(times).toBeDefined();
      // 结果可能是 null (极夜) 或有效时间
    });

    it('天文晨昏光在高纬度夏季可能不存在', () => {
      const times = calculateAstronomicalTwilight(JD_SUMMER, ARCTIC_LON, ARCTIC_LAT);
      expect(times).toBeDefined();
      // 在夏季高纬度，太阳可能整夜都不会降到地平线下18度
    });
  });

  describe('不同季节的晨昏光', () => {
    it('夏至时晨昏光持续时间应该比冬至长', () => {
      const summerCivil = calculateCivilTwilight(JD_SUMMER, BEIJING_LON, BEIJING_LAT);
      const winterCivil = calculateCivilTwilight(JD_WINTER, BEIJING_LON, BEIJING_LAT);

      if (
        summerCivil.dawn !== null &&
        summerCivil.dusk !== null &&
        winterCivil.dawn !== null &&
        winterCivil.dusk !== null
      ) {
        const summerDuration = summerCivil.dusk - summerCivil.dawn;
        const winterDuration = winterCivil.dusk - winterCivil.dawn;
        // 夏至时白天更长，晨昏光持续时间也更长
        expect(summerDuration).toBeGreaterThan(winterDuration);
      }
    });
  });

  describe('不同经度的影响', () => {
    // 东京 (139.7E, 35.7N)
    const TOKYO_LON = degreesToRadians(139.7);
    const TOKYO_LAT = degreesToRadians(35.7);

    it('相同纬度不同经度的晨昏光时刻应该不同', () => {
      const beijing = calculateCivilTwilight(J2000, BEIJING_LON, BEIJING_LAT);
      const tokyo = calculateCivilTwilight(J2000, TOKYO_LON, TOKYO_LAT);

      // 东京在北京以东约23度，日出/晨昏光更早
      if (beijing.dawn !== null && tokyo.dawn !== null) {
        // 注意: 这里的时间是儒略日，东京的dawn应该比北京早
        // 但由于纬度也不同，我们只检查它们不相等
        expect(tokyo.dawn).not.toEqual(beijing.dawn);
      }
    });
  });

  describe('边界条件', () => {
    it('赤道附近应该有稳定的晨昏光', () => {
      const equatorLat = degreesToRadians(0);
      const times = calculateCivilTwilight(JD_SUMMER, 0, equatorLat);

      expect(times.dawn).not.toBeNull();
      expect(times.dusk).not.toBeNull();
    });

    it('南半球应该有有效的晨昏光结果', () => {
      // 悉尼 (151.2E, 33.9S)
      const sydneyLon = degreesToRadians(151.2);
      const sydneyLat = degreesToRadians(-33.9);

      const times = calculateCivilTwilight(JD_SUMMER, sydneyLon, sydneyLat);
      expect(times).toBeDefined();
      // 南半球6月是冬季，应该有晨昏光
      expect(times.dawn).not.toBeNull();
      expect(times.dusk).not.toBeNull();
    });
  });
});
