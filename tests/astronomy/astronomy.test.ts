/**
 * 天文API模块测试 - Astronomy API Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getSunPosition,
  getMoonPosition,
  getPlanetPosition,
  getSunTimes,
  getMoonTimes,
  getMoonPhase,
  getSolarTerms,
  Planet,
  ObserverLocation,
} from '../../src/astronomy';

describe('天文API - Astronomy API', () => {
  // 北京观测点
  const beijing: ObserverLocation = {
    longitude: 116.4,
    latitude: 39.9,
    altitude: 50,
  };

  describe('getSunPosition', () => {
    it('应返回太阳位置信息', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getSunPosition(date);

      // 检查返回的属性
      expect(position).toHaveProperty('longitude');
      expect(position).toHaveProperty('latitude');
      expect(position).toHaveProperty('rightAscension');
      expect(position).toHaveProperty('declination');
      expect(position).toHaveProperty('distance');
    });

    it('夏至时太阳黄经应约为90度', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getSunPosition(date);

      // 夏至太阳黄经约90度
      expect(position.longitude).toBeCloseTo(90, 0);
    });

    it('冬至时太阳黄经应约为270度', () => {
      const date = new Date('2024-12-21T12:00:00');
      const position = getSunPosition(date);

      // 冬至太阳黄经约270度
      expect(position.longitude).toBeCloseTo(270, 0);
    });

    it('提供观测地点时应返回地平坐标', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getSunPosition(date, beijing);

      expect(position.azimuth).toBeDefined();
      expect(position.altitude).toBeDefined();
      // 中午时分太阳应该在地平线以上
      expect(position.altitude).toBeGreaterThan(0);
    });
  });

  describe('getMoonPosition', () => {
    it('应返回月球位置信息', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getMoonPosition(date);

      expect(position).toHaveProperty('longitude');
      expect(position).toHaveProperty('latitude');
      expect(position).toHaveProperty('rightAscension');
      expect(position).toHaveProperty('declination');
      expect(position).toHaveProperty('distance');
    });

    it('月球黄经应在0-360度范围内', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getMoonPosition(date);

      expect(position.longitude).toBeGreaterThanOrEqual(0);
      expect(position.longitude).toBeLessThan(360);
    });

    it('提供观测地点时应返回地平坐标', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getMoonPosition(date, beijing);

      expect(position.azimuth).toBeDefined();
      expect(position.altitude).toBeDefined();
    });
  });

  describe('getPlanetPosition', () => {
    it('应返回火星位置信息', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getPlanetPosition(Planet.Mars, date);

      expect(position).toHaveProperty('longitude');
      expect(position).toHaveProperty('latitude');
      expect(position).toHaveProperty('magnitude');
      expect(position).toHaveProperty('phaseAngle');
    });

    it('应返回木星位置信息', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getPlanetPosition(Planet.Jupiter, date);

      expect(position.longitude).toBeGreaterThanOrEqual(0);
      expect(position.longitude).toBeLessThan(360);
      // 木星较亮，星等通常在 -3 到 -1 之间
      expect(position.magnitude).toBeLessThan(0);
    });

    it('应返回金星位置信息', () => {
      const date = new Date('2024-06-21T12:00:00');
      const position = getPlanetPosition(Planet.Venus, date);

      // 金星是最亮的行星
      expect(position.magnitude).toBeLessThan(0);
    });
  });

  describe('getSunTimes', () => {
    it('应返回日出日落时刻', () => {
      const date = new Date('2024-06-21');
      const times = getSunTimes(date, beijing);

      expect(times.rise).toBeInstanceOf(Date);
      expect(times.transit).toBeInstanceOf(Date);
      expect(times.set).toBeInstanceOf(Date);
    });

    it('日出应早于日落', () => {
      const date = new Date('2024-06-21');
      const times = getSunTimes(date, beijing);

      expect(times.rise!.getTime()).toBeLessThan(times.transit!.getTime());
      expect(times.transit!.getTime()).toBeLessThan(times.set!.getTime());
    });

    it('夏至日昼长应大于12小时', () => {
      const date = new Date('2024-06-21');
      const times = getSunTimes(date, beijing);

      const dayLength = (times.set!.getTime() - times.rise!.getTime()) / (1000 * 3600);
      expect(dayLength).toBeGreaterThan(14); // 北京夏至昼长约14-15小时
    });

    it('冬至日昼长应小于12小时', () => {
      const date = new Date('2024-12-21');
      const times = getSunTimes(date, beijing);

      const dayLength = (times.set!.getTime() - times.rise!.getTime()) / (1000 * 3600);
      expect(dayLength).toBeLessThan(10); // 北京冬至昼长约9-10小时
    });
  });

  describe('getMoonTimes', () => {
    it('应返回月升月落时刻', () => {
      const date = new Date('2024-06-21');
      const times = getMoonTimes(date, beijing);

      // 月升月落可能有null（月球可能整天可见或不可见）
      expect(times).toHaveProperty('rise');
      expect(times).toHaveProperty('transit');
      expect(times).toHaveProperty('set');
    });
  });

  describe('getMoonPhase', () => {
    it('应返回月相信息', () => {
      const date = new Date('2024-06-21');
      const phase = getMoonPhase(date);

      expect(phase).toHaveProperty('phase');
      expect(phase).toHaveProperty('name');
      expect(phase).toHaveProperty('illumination');
      expect(phase).toHaveProperty('nextNewMoon');
      expect(phase).toHaveProperty('nextFullMoon');
    });

    it('月相角度应在0-360度范围内', () => {
      const date = new Date('2024-06-21');
      const phase = getMoonPhase(date);

      expect(phase.phase).toBeGreaterThanOrEqual(0);
      expect(phase.phase).toBeLessThan(360);
    });

    it('光照比例应在0-1范围内', () => {
      const date = new Date('2024-06-21');
      const phase = getMoonPhase(date);

      expect(phase.illumination).toBeGreaterThanOrEqual(0);
      expect(phase.illumination).toBeLessThanOrEqual(1);
    });

    it('应返回有效的月相名称', () => {
      const validNames = ['新月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
      const date = new Date('2024-06-21');
      const phase = getMoonPhase(date);

      expect(validNames).toContain(phase.name);
    });
  });

  describe('getSolarTerms', () => {
    it('应返回24个节气', () => {
      const terms = getSolarTerms(2024);

      expect(terms.length).toBe(24);
    });

    it('应包含所有24节气名称', () => {
      const terms = getSolarTerms(2024);
      const expectedNames = [
        '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
        '春分', '清明', '谷雨', '立夏', '小满', '芒种',
        '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
        '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
      ];

      const termNames = terms.map((t) => t.name);
      for (const name of expectedNames) {
        expect(termNames).toContain(name);
      }
    });

    it('春分应在3月左右', () => {
      const terms = getSolarTerms(2024);
      const chunfen = terms.find((t) => t.name === '春分');

      expect(chunfen).toBeDefined();
      // 春分在3月
      expect(chunfen!.date.getMonth()).toBeGreaterThanOrEqual(2); // 3月 (0-indexed)
      expect(chunfen!.date.getMonth()).toBeLessThanOrEqual(3); // 最晚4月
    });

    it('夏至应在6月左右', () => {
      const terms = getSolarTerms(2024);
      const xiazhi = terms.find((t) => t.name === '夏至');

      expect(xiazhi).toBeDefined();
      // 夏至在6月
      expect(xiazhi!.date.getMonth()).toBeGreaterThanOrEqual(5); // 6月 (0-indexed)
      expect(xiazhi!.date.getMonth()).toBeLessThanOrEqual(6); // 最晚7月
    });

    it('冬至应在12月或1月左右', () => {
      const terms = getSolarTerms(2024);
      const dongzhi = terms.find((t) => t.name === '冬至');

      expect(dongzhi).toBeDefined();
      // 冬至在12月或下一年1月
      const month = dongzhi!.date.getMonth();
      expect(month === 11 || month === 0).toBe(true); // 12月或1月
    });
  });
});
