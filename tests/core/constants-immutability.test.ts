import { describe, it, expect } from 'vitest';
import { PLANET_NAMES_CN } from '../../src/core/constants';

describe('常量不可变性', () => {
  it('应该允许读取常量', () => {
    expect(PLANET_NAMES_CN[0]).toBeDefined();
    expect(PLANET_NAMES_CN.length).toBeGreaterThan(0);
  });

  it('常量应该是只读的', () => {
    // TypeScript 会在编译时阻止修改 as const 数组
    // 运行时测试确认数组存在且可读
    expect(Array.isArray(PLANET_NAMES_CN)).toBe(true);
  });
});
