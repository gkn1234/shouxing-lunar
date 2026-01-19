// tests/core/series.test.ts
import { describe, it, expect } from 'vitest';
import { calculateVSOP87Series, calculateMoonSeries } from '../../src/core/series';

describe('calculateVSOP87Series', () => {
  it('应该正确计算VSOP87三参数级数', () => {
    // 简单测试数据: [A, B, C]
    const data = [
      1.0, 0.0, 0.0,  // A * cos(B + C*t) = 1.0 * cos(0) = 1.0
      0.5, Math.PI, 0.0,  // 0.5 * cos(π) = -0.5
    ];

    const result = calculateVSOP87Series(data, 0);
    expect(result).toBeCloseTo(0.5, 5); // 1.0 + (-0.5) = 0.5
  });

  it('空数据应返回0', () => {
    const result = calculateVSOP87Series([], 0);
    expect(result).toBe(0);
  });

  it('应该遵守项数参数限制', () => {
    const data = [
      1.0, 0.0, 0.0,
      0.5, Math.PI, 0.0,
    ];

    const result = calculateVSOP87Series(data, 0, 1); // 只计算第一项
    expect(result).toBeCloseTo(1.0, 5);
  });
});

describe('calculateMoonSeries', () => {
  it('应该正确计算月球六参数级数', () => {
    // 简单测试数据: [A, B, C, D, E, F]
    const data = [
      1.0, 0.0, 0.0, 0.0, 0.0, 0.0,  // A * cos(B) = 1.0
    ];

    const result = calculateMoonSeries(data, 0);
    expect(result).toBeCloseTo(1.0, 5);
  });

  it('应该正确处理t的幂次', () => {
    const data = [
      1.0, 0.0, 1.0, 0.0, 0.0, 0.0,  // A * cos(B + C*t)
    ];

    const t = 0.1;
    const expected = Math.cos(0.1);
    const result = calculateMoonSeries(data, t);
    expect(result).toBeCloseTo(expected, 5);
  });
});
