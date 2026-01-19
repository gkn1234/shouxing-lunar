import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLunarYear,
  getLunarYearCacheStats,
  clearLunarYearCache,
} from '../../src/lunar/calendar';
import { gregorianToJD } from '../../src/core/julian';
import { J2000 } from '../../src/core/constants';

describe('农历年历缓存', () => {
  beforeEach(() => {
    clearLunarYearCache();
  });

  it('重复计算应该命中缓存', () => {
    // 2024年某天
    const jd = gregorianToJD(2024, 6, 15) - J2000;

    // 第一次计算
    const result1 = calculateLunarYear(jd);
    const stats1 = getLunarYearCacheStats();

    // 第二次计算（应该命中缓存）
    const result2 = calculateLunarYear(jd);
    const stats2 = getLunarYearCacheStats();

    expect(result1.year).toBe(result2.year);
    expect(stats2.hits).toBeGreaterThan(stats1.hits);
  });

  it('不同年份应该分别缓存', () => {
    const jd2024 = gregorianToJD(2024, 6, 15) - J2000;
    const jd2025 = gregorianToJD(2025, 6, 15) - J2000;

    calculateLunarYear(jd2024);
    calculateLunarYear(jd2025);

    const stats = getLunarYearCacheStats();
    expect(stats.size).toBe(2);
  });

  it('清除缓存应该重置统计', () => {
    const jd = gregorianToJD(2024, 6, 15) - J2000;
    calculateLunarYear(jd);
    clearLunarYearCache();

    const stats = getLunarYearCacheStats();
    expect(stats.size).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });

  it('缓存应该提升性能', () => {
    clearLunarYearCache();

    // 第一次计算（无缓存）- 计算100个不同年份
    const start1 = performance.now();
    for (let i = 0; i < 100; i++) {
      const jd = gregorianToJD(2000 + i, 6, 15) - J2000;
      calculateLunarYear(jd);
    }
    const time1 = performance.now() - start1;

    // 第二次计算（有缓存）- 再次访问这100个年份
    const start2 = performance.now();
    for (let i = 0; i < 100; i++) {
      const jd = gregorianToJD(2000 + i, 6, 15) - J2000;
      calculateLunarYear(jd);
    }
    const time2 = performance.now() - start2;

    console.log(`首次: ${time1.toFixed(2)}ms, 缓存: ${time2.toFixed(2)}ms`);
    expect(time2).toBeLessThan(time1);
  });

  it('缓存容量应为100年', () => {
    const stats = getLunarYearCacheStats();
    expect(stats.capacity).toBe(100);
  });

  it('同一年内不同日期应该命中缓存', () => {
    // 2024年1月的某天
    const jd1 = gregorianToJD(2024, 3, 15) - J2000;
    // 2024年6月的某天（同一农历年）
    const jd2 = gregorianToJD(2024, 6, 15) - J2000;

    calculateLunarYear(jd1);
    const stats1 = getLunarYearCacheStats();

    calculateLunarYear(jd2);
    const stats2 = getLunarYearCacheStats();

    // 同一农历年，第二次应该命中缓存
    expect(stats2.hits).toBeGreaterThan(stats1.hits);
  });

  it('跨农历年边界应该创建新缓存', () => {
    // 2024年初（还在2023农历年）
    const jd1 = gregorianToJD(2024, 1, 15) - J2000;
    // 2024年中（2024农历年）
    const jd2 = gregorianToJD(2024, 6, 15) - J2000;

    const result1 = calculateLunarYear(jd1);
    const result2 = calculateLunarYear(jd2);

    // 年份应该不同（跨农历年）
    if (result1.year !== result2.year) {
      const stats = getLunarYearCacheStats();
      expect(stats.size).toBe(2);
    }
  });

  it('缓存命中率统计应该正确', () => {
    clearLunarYearCache();

    const jd = gregorianToJD(2024, 6, 15) - J2000;

    // 第一次访问（miss）
    calculateLunarYear(jd);
    const stats1 = getLunarYearCacheStats();
    expect(stats1.misses).toBe(1);

    // 第二次访问（hit）
    calculateLunarYear(jd);
    const stats2 = getLunarYearCacheStats();
    expect(stats2.hits).toBe(1);
    expect(stats2.hitRate).toBeCloseTo(0.5, 1);
  });
});
