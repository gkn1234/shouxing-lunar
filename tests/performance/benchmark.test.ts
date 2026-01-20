import { describe, it, expect, beforeEach } from 'vitest';
import { calculateLunarYear, clearLunarYearCache, getLunarYearCacheStats } from '../../src/lunar/calendar';
import { LunarDate } from '../../src/lunar/lunar-date';
import { getSunPosition, getMoonPosition } from '../../src/astronomy/astronomy';

describe('性能基准测试', () => {
  beforeEach(() => {
    clearLunarYearCache();
  });

  it('计算100个农历年历应该在合理时间内完成', () => {
    const start = performance.now();

    for (let year = 2000; year < 2100; year++) {
      const jd = (year - 2000) * 365.2422;
      calculateLunarYear(jd);
    }

    const elapsed = performance.now() - start;
    console.log(`100个农历年历: ${elapsed.toFixed(2)}ms`);

    // 应该在1秒内完成
    expect(elapsed).toBeLessThan(1000);
  });

  it('缓存应该显著提升性能', () => {
    // 第一轮：无缓存
    clearLunarYearCache();
    const start1 = performance.now();
    for (let year = 2000; year < 2010; year++) {
      const jd = (year - 2000) * 365.2422;
      calculateLunarYear(jd);
    }
    const time1 = performance.now() - start1;

    // 第二轮：有缓存
    const start2 = performance.now();
    for (let year = 2000; year < 2010; year++) {
      const jd = (year - 2000) * 365.2422;
      calculateLunarYear(jd);
    }
    const time2 = performance.now() - start2;

    console.log(`首次计算: ${time1.toFixed(2)}ms`);
    console.log(`缓存计算: ${time2.toFixed(2)}ms`);
    console.log(`加速比: ${(time1 / time2).toFixed(1)}x`);

    // 缓存应该至少快10倍
    expect(time2).toBeLessThan(time1 / 10);
  });

  it('创建1000个农历日期对象', () => {
    const start = performance.now();

    const dates = [];
    for (let i = 0; i < 1000; i++) {
      dates.push(new LunarDate(2024, 1, 1));
    }

    const elapsed = performance.now() - start;
    console.log(`1000个日期对象: ${elapsed.toFixed(2)}ms`);
    console.log(`平均: ${(elapsed / 1000).toFixed(3)}ms/个`);

    expect(elapsed).toBeLessThan(500);
  });

  it('计算100个太阳位置', () => {
    const start = performance.now();

    const location = { longitude: 116.4, latitude: 39.9 };
    for (let i = 0; i < 100; i++) {
      getSunPosition(`2024-06-${(i % 30) + 1}`, location);
    }

    const elapsed = performance.now() - start;
    console.log(`100个太阳位置: ${elapsed.toFixed(2)}ms`);
    console.log(`平均: ${(elapsed / 100).toFixed(2)}ms/个`);

    expect(elapsed).toBeLessThan(1000);
  });

  it('格式化1000个日期', () => {
    const date = new LunarDate(2024, 2, 10);

    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      date.format('YYYY-MM-DD 农历lYYYY年lMM月lDD GY年GM月GD日');
    }

    const elapsed = performance.now() - start;
    console.log(`1000次格式化: ${elapsed.toFixed(2)}ms`);
    console.log(`平均: ${(elapsed / 1000).toFixed(3)}ms/次`);

    expect(elapsed).toBeLessThan(100);
  });
});

describe('缓存统计', () => {
  beforeEach(() => {
    clearLunarYearCache();
  });

  it('应该正确统计缓存命中率', () => {
    // 计算10个不同年份
    for (let i = 0; i < 10; i++) {
      calculateLunarYear(i * 365.2422);
    }

    // 再次计算相同年份
    for (let i = 0; i < 10; i++) {
      calculateLunarYear(i * 365.2422);
    }

    const stats = getLunarYearCacheStats();
    console.log('缓存统计:', stats);

    expect(stats.size).toBe(10);
    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.hitRate).toBeGreaterThan(0.4);
  });
});
