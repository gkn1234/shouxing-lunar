/**
 * 数据模块测试 - Data Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  // 城市数据
  decodeCoordinates,
  encodeCoordinates,
  PROVINCES,
  getCitiesByProvince,
  getProvincialCapital,
  findCityByName,
  getAllCities,
  MAJOR_CITIES,
  // 历史纪年
  DYNASTIES,
  getEraData,
  findEraByYear,
  findEraByName,
  findErasByDynasty,
  yearToEraString,
  getDynastyByYear,
} from '../../src/data';

describe('城市数据 - City Data', () => {
  describe('decodeCoordinates', () => {
    it('应正确解码北京坐标', () => {
      // 北京 dshN -> 纬度约40度, 经度约116度
      const [lon, lat] = decodeCoordinates('dshN');
      expect(lon).toBeCloseTo(116, 0);
      expect(lat).toBeCloseTo(40, 0);
    });

    it('应正确解码上海坐标', () => {
      // 上海 VEmS -> 纬度约31度, 经度约121度
      const [lon, lat] = decodeCoordinates('VEmS');
      expect(lon).toBeCloseTo(121, 0);
      expect(lat).toBeCloseTo(31, 0);
    });

    it('解码后经纬度应在合理范围内', () => {
      // 任意中国城市编码
      const [lon, lat] = decodeCoordinates('NJha');
      expect(lon).toBeGreaterThan(73); // 中国东经73度以东
      expect(lon).toBeLessThan(135); // 中国东经135度以西
      expect(lat).toBeGreaterThan(3); // 中国北纬3度以北
      expect(lat).toBeLessThan(54); // 中国北纬54度以南
    });
  });

  describe('encodeCoordinates', () => {
    it('编码后应能正确解码', () => {
      const lon = 116.4;
      const lat = 39.9;
      const encoded = encodeCoordinates(lon, lat);
      const [decodedLon, decodedLat] = decodeCoordinates(encoded);

      expect(decodedLon).toBeCloseTo(lon, 0);
      expect(decodedLat).toBeCloseTo(lat, 0);
    });
  });

  describe('PROVINCES', () => {
    it('应包含所有省份', () => {
      expect(PROVINCES.length).toBeGreaterThanOrEqual(30);
      expect(PROVINCES).toContain('北京市');
      expect(PROVINCES).toContain('上海市');
      expect(PROVINCES).toContain('广东省');
      expect(PROVINCES).toContain('四川省');
      expect(PROVINCES).toContain('台湾省');
      expect(PROVINCES).toContain('香港');
    });
  });

  describe('getCitiesByProvince', () => {
    it('应返回北京市的城市列表', () => {
      const cities = getCitiesByProvince('北京市');
      expect(cities.length).toBeGreaterThan(0);
      expect(cities.some((c) => c.name.includes('天安门'))).toBe(true);
    });

    it('应返回广东省的城市列表', () => {
      const cities = getCitiesByProvince('广东省');
      expect(cities.length).toBeGreaterThan(10);
      expect(cities.some((c) => c.name.includes('广州'))).toBe(true);
      expect(cities.some((c) => c.name.includes('深圳'))).toBe(true);
    });

    it('不存在的省份应返回空数组', () => {
      const cities = getCitiesByProvince('不存在省');
      expect(cities).toEqual([]);
    });
  });

  describe('getProvincialCapital', () => {
    it('应返回省会城市', () => {
      const beijing = getProvincialCapital('北京市');
      expect(beijing).not.toBeNull();
      expect(beijing?.name).toContain('天安门');

      const guangzhou = getProvincialCapital('广东省');
      expect(guangzhou).not.toBeNull();
      expect(guangzhou?.name).toContain('广州');
    });

    it('不存在的省份应返回null', () => {
      const result = getProvincialCapital('不存在省');
      expect(result).toBeNull();
    });
  });

  describe('findCityByName', () => {
    it('应能找到城市', () => {
      const results = findCityByName('北京');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应能模糊匹配', () => {
      const results = findCityByName('深圳');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].province).toBe('广东省');
    });
  });

  describe('getAllCities', () => {
    it('应返回所有城市', () => {
      const cities = getAllCities();
      expect(cities.length).toBeGreaterThan(300);
    });
  });

  describe('MAJOR_CITIES', () => {
    it('应包含主要城市', () => {
      expect(MAJOR_CITIES['北京']).toBeDefined();
      expect(MAJOR_CITIES['上海']).toBeDefined();
      expect(MAJOR_CITIES['广州']).toBeDefined();
      expect(MAJOR_CITIES['深圳']).toBeDefined();

      expect(MAJOR_CITIES['北京'].longitude).toBeCloseTo(116.4, 0);
      expect(MAJOR_CITIES['北京'].latitude).toBeCloseTo(39.9, 0);
    });
  });
});

describe('历史纪年 - Historical Eras', () => {
  describe('DYNASTIES', () => {
    it('应包含主要朝代', () => {
      const dynastyNames = DYNASTIES.map((d) => d.name);
      expect(dynastyNames).toContain('秦');
      expect(dynastyNames).toContain('唐');
      expect(dynastyNames).toContain('明');
      expect(dynastyNames).toContain('清');
    });

    it('朝代应有正确的年代范围', () => {
      const tang = DYNASTIES.find((d) => d.name === '唐');
      expect(tang).toBeDefined();
      expect(tang?.startYear).toBe(618);
      expect(tang?.endYear).toBe(907);

      const qing = DYNASTIES.find((d) => d.name === '清');
      expect(qing).toBeDefined();
      expect(qing?.startYear).toBe(1644);
      expect(qing?.endYear).toBe(1911);
    });
  });

  describe('getEraData', () => {
    it('应返回年号数据', () => {
      const eras = getEraData();
      expect(eras.length).toBeGreaterThan(100);
    });
  });

  describe('findEraByYear', () => {
    it('应找到正确的年号 - 贞观年间', () => {
      const eras = findEraByYear(630);
      expect(eras.length).toBeGreaterThan(0);
      expect(eras.some((e) => e.eraName === '贞观')).toBe(true);
    });

    it('应找到正确的年号 - 康熙年间', () => {
      const eras = findEraByYear(1700);
      expect(eras.length).toBeGreaterThan(0);
      expect(eras.some((e) => e.eraName === '康熙')).toBe(true);
    });

    it('应找到正确的年号 - 乾隆年间', () => {
      const eras = findEraByYear(1750);
      expect(eras.length).toBeGreaterThan(0);
      expect(eras.some((e) => e.eraName === '乾隆')).toBe(true);
    });
  });

  describe('findEraByName', () => {
    it('应能按年号名称查找', () => {
      const eras = findEraByName('贞观');
      expect(eras.length).toBeGreaterThan(0);
      // 应包含唐朝的贞观年号
      expect(eras.some((e) => e.dynasty === '唐' && e.eraName === '贞观')).toBe(true);
    });

    it('应能按年号名称查找 - 康熙', () => {
      const eras = findEraByName('康熙');
      expect(eras.length).toBeGreaterThan(0);
      // 应包含清朝的康熙年号
      expect(eras.some((e) => e.dynasty === '清' && e.eraName === '康熙')).toBe(true);
    });
  });

  describe('findErasByDynasty', () => {
    it('应能按朝代查找所有年号', () => {
      const tangEras = findErasByDynasty('唐');
      expect(tangEras.length).toBeGreaterThan(20);

      const mingEras = findErasByDynasty('明');
      expect(mingEras.length).toBeGreaterThan(10);
    });
  });

  describe('yearToEraString', () => {
    it('应转换为正确的年号纪年 - 贞观元年', () => {
      const result = yearToEraString(627);
      expect(result).toContain('贞观');
      expect(result).toContain('元年');
    });

    it('应转换为正确的年号纪年 - 康熙五十年', () => {
      const result = yearToEraString(1711);
      expect(result).toContain('康熙');
      expect(result).toContain('五十');
    });

    it('应转换为正确的年号纪年 - 乾隆十年', () => {
      const result = yearToEraString(1745);
      expect(result).toContain('乾隆');
      expect(result).toContain('十');
    });
  });

  describe('getDynastyByYear', () => {
    it('应返回正确的朝代', () => {
      const tang = getDynastyByYear(700);
      expect(tang).not.toBeNull();
      expect(tang?.name).toBe('唐');

      const qing = getDynastyByYear(1800);
      expect(qing).not.toBeNull();
      expect(qing?.name).toBe('清');
    });

    it('远古年份应返回null', () => {
      const result = getDynastyByYear(-5000);
      expect(result).toBeNull();
    });
  });
});
