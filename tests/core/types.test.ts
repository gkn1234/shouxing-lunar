import { describe, it, expect } from 'vitest';
import {
  toRadians,
  toDegrees,
  asRadians,
  asDegrees,
} from '../../src/core/types';

describe('品牌类型', () => {
  it('应该将度转换为弧度', () => {
    const deg = asDegrees(180);
    const rad = toRadians(deg);
    expect(rad).toBeCloseTo(Math.PI, 10);
  });

  it('应该将弧度转换为度', () => {
    const rad = asRadians(Math.PI);
    const deg = toDegrees(rad);
    expect(deg).toBeCloseTo(180, 10);
  });

  it('应该支持往返转换', () => {
    const original = asDegrees(45);
    const rad = toRadians(original);
    const back = toDegrees(rad);
    expect(back).toBeCloseTo(45, 10);
  });
});
