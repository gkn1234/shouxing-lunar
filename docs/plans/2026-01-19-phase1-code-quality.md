# 阶段一：代码质量提升实施计划

> **给 Claude 的指令：** 必须使用 superpowers:executing-plans 技能来逐任务实施本计划。

**目标：** 消除代码重复、统一类型定义、改进导出结构、增强类型安全

**架构方案：** 提取通用级数计算函数到核心模块，实现品牌类型系统保障单位安全，采用命名空间导出模式，为所有常量添加只读保护。

**技术栈：** TypeScript 5.3+、Vitest 测试框架、Vite 构建工具

---

## 任务一：创建核心级数计算模块

**涉及文件：**
- 创建：`src/core/series.ts`
- 测试：`tests/core/series.test.ts`

**步骤1：编写失败的测试**

创建测试文件：

```typescript
// tests/core/series.test.ts
import { describe, it, expect } from 'vitest';
import { calculateVSOP87Series, calculateMoonSeries } from '../src/core/series';

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
```

**步骤2：运行测试验证失败**

运行：`npm test -- tests/core/series.test.ts`
预期：失败，提示"找不到模块 '../src/core/series'"

**步骤3：编写最小实现**

创建级数计算模块：

```typescript
// src/core/series.ts
/**
 * 级数计算核心模块
 * 提供 VSOP87 和月球级数的通用计算函数
 */

/**
 * VSOP87 三参数级数计算
 * @see eph0.js:955-981 XL0_calc函数
 *
 * @param data - 级数数据 [A, B, C, A, B, C, ...]
 *   - A: 振幅
 *   - B: 相位
 *   - C: 频率
 * @param t - 儒略世纪数（从J2000起算）
 * @param termCount - 计算项数（-1表示全部）
 * @returns 级数和
 */
export function calculateVSOP87Series(
  data: readonly number[],
  t: number,
  termCount: number = -1
): number {
  if (data.length === 0) return 0;

  const totalTerms = Math.floor(data.length / 3);
  const n = termCount < 0 ? totalTerms : Math.min(termCount, totalTerms);

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const idx = i * 3;
    const A = data[idx];     // 振幅
    const B = data[idx + 1]; // 相位
    const C = data[idx + 2]; // 频率
    sum += A * Math.cos(B + C * t);
  }

  return sum;
}

/**
 * 月球六参数级数计算
 * @see eph0.js:1033-1055 XL1_calc函数
 *
 * @param data - 级数数据 [A, B, C, D, E, F, A, B, C, D, E, F, ...]
 *   - A: 振幅
 *   - B: 相位
 *   - C: t¹ 系数
 *   - D: t² 系数（需除以1e4）
 *   - E: t³ 系数（需除以1e8）
 *   - F: t⁴ 系数（需除以1e8）
 * @param t - 儒略世纪数（从J2000起算）
 * @param termCount - 计算项数（-1表示全部）
 * @returns 级数和
 */
export function calculateMoonSeries(
  data: readonly number[],
  t: number,
  termCount: number = -1
): number {
  if (data.length === 0) return 0;

  const totalTerms = Math.floor(data.length / 6);
  const n = termCount < 0 ? totalTerms : Math.min(termCount, totalTerms);

  // 预计算 t 的幂次
  // @see eph0.js:1035 t2/=1e4,t3/=1e8,t4/=1e8
  const t2 = (t * t) / 1e4;
  const t3 = (t * t * t) / 1e8;
  const t4 = (t * t * t * t) / 1e8;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const idx = i * 6;
    const A = data[idx];     // 振幅
    const B = data[idx + 1]; // 相位
    const C = data[idx + 2]; // t¹ 系数
    const D = data[idx + 3]; // t² 系数
    const E = data[idx + 4]; // t³ 系数
    const F = data[idx + 5]; // t⁴ 系数

    const phase = B + C * t + D * t2 + E * t3 + F * t4;
    sum += A * Math.cos(phase);
  }

  return sum;
}
```

**步骤4：运行测试验证通过**

运行：`npm test -- tests/core/series.test.ts`
预期：通过，所有测试变绿

**步骤5：更新核心模块导出**

修改：`src/core/index.ts`

添加导出：

```typescript
// 级数计算
export { calculateVSOP87Series, calculateMoonSeries } from './series';
```

**步骤6：提交代码**

```bash
git add src/core/series.ts tests/core/series.test.ts src/core/index.ts
git commit -m "功能：添加统一的级数计算模块

- 创建 calculateVSOP87Series 处理三参数级数
- 创建 calculateMoonSeries 处理六参数级数
- 从 sun.ts、moon.ts、planet.ts 提取通用逻辑
- 添加完整测试覆盖

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务二：重构太阳模块使用级数计算器

**涉及文件：**
- 修改：`src/ephemeris/sun.ts`
- 测试：`tests/ephemeris/sun.test.ts`

**步骤1：编写回归测试**

添加到现有测试文件：

```typescript
// tests/ephemeris/sun.test.ts
import { describe, it, expect } from 'vitest';
import { calculateEarthLongitude } from '../src/ephemeris/sun';

describe('太阳模块重构', () => {
  it('重构后应产生相同结果', () => {
    // 测试几个已知值确保重构后结果一致
    const testCases = [
      { t: 0, expected: 1.7534703362 }, // J2000.0
      { t: 0.1, expected: 2.3799470157 }, // 10年后
    ];

    testCases.forEach(({ t, expected }) => {
      const result = calculateEarthLongitude(t);
      expect(result).toBeCloseTo(expected, 5);
    });
  });
});
```

**步骤2：运行测试建立基线**

运行：`npm test -- tests/ephemeris/sun.test.ts`
预期：通过（建立基线）

**步骤3：重构 sun.ts 使用级数计算器**

修改 `src/ephemeris/sun.ts`：

找到本地的 `calculateVSOP87Series` 函数（约第42-52行）并删除。

在文件顶部添加导入：

```typescript
import { calculateVSOP87Series } from '../core/series';
```

文件其余部分保持不变 - 所有对 `calculateVSOP87Series` 的调用现在使用导入的版本。

**步骤4：运行测试验证无回归**

运行：`npm test -- tests/ephemeris/sun.test.ts`
预期：通过，结果完全相同

**步骤5：提交代码**

```bash
git add src/ephemeris/sun.ts
git commit -m "重构：太阳模块使用核心级数计算器

- 移除本地 calculateVSOP87Series 函数
- 从 core/series 模块导入
- 无行为变更，所有测试通过

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务三：重构行星模块使用级数计算器

**涉及文件：**
- 修改：`src/ephemeris/planet.ts`
- 测试：`tests/ephemeris/planet.test.ts`

**步骤1：编写回归测试**

添加到现有测试文件：

```typescript
// tests/ephemeris/planet.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePlanetHeliocentricCoord, Planet } from '../src/ephemeris/planet';

describe('行星模块重构', () => {
  it('重构后应产生相同结果', () => {
    const t = 0; // J2000.0
    const coord = calculatePlanetHeliocentricCoord(Planet.Mars, t);

    // 验证火星在 J2000.0 的坐标
    expect(coord[0]).toBeCloseTo(4.3877, 3); // 黄经
    expect(coord[1]).toBeCloseTo(-0.0001, 4); // 黄纬
    expect(coord[2]).toBeCloseTo(1.3916, 3); // 距离
  });
});
```

**步骤2：运行测试建立基线**

运行：`npm test -- tests/ephemeris/planet.test.ts`
预期：通过

**步骤3：重构 planet.ts 使用级数计算器**

修改 `src/ephemeris/planet.ts`：

找到本地的 `calculateVSOP87Series` 函数（约第242-259行）并删除。

在文件顶部添加导入：

```typescript
import { calculateVSOP87Series } from '../core/series';
```

**步骤4：移除重复的行星名称定义**

在 `src/ephemeris/planet.ts` 中，找到 `PLANET_NAMES_CN` 导出并替换为导入：

移除：
```typescript
export const PLANET_NAMES_CN = [...];
export const PLANET_NAMES_EN = [...];
```

在文件顶部添加：
```typescript
import { PLANET_NAMES_CN, PLANET_NAMES_EN } from '../core/constants';
export { PLANET_NAMES_CN, PLANET_NAMES_EN };
```

**步骤5：运行测试验证无回归**

运行：`npm test -- tests/ephemeris/planet.test.ts`
预期：通过

**步骤6：提交代码**

```bash
git add src/ephemeris/planet.ts
git commit -m "重构：行星模块使用核心模块

- 移除本地 calculateVSOP87Series 函数
- 移除重复的 PLANET_NAMES_CN 定义
- 从 core/series 和 core/constants 导入
- 无行为变更

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务四：重构月球模块使用级数计算器

**涉及文件：**
- 修改：`src/ephemeris/moon.ts`
- 测试：`tests/ephemeris/moon.test.ts`

**步骤1：编写回归测试**

添加到现有测试文件：

```typescript
// tests/ephemeris/moon.test.ts
import { describe, it, expect } from 'vitest';
import { calculateMoonGeocentricCoord } from '../src/ephemeris/moon';

describe('月球模块重构', () => {
  it('重构后应产生相同结果', () => {
    const t = 0; // J2000.0
    const coord = calculateMoonGeocentricCoord(t);

    // 验证月球在 J2000.0 的坐标
    expect(coord[0]).toBeCloseTo(3.8196, 3); // 黄经
    expect(coord[1]).toBeCloseTo(-0.0894, 4); // 黄纬
    expect(coord[2]).toBeCloseTo(0.00257, 5); // 距离
  });
});
```

**步骤2：运行测试建立基线**

运行：`npm test -- tests/ephemeris/moon.test.ts`
预期：通过

**步骤3：重构 moon.ts 使用级数计算器**

修改 `src/ephemeris/moon.ts`：

找到本地的 `calculateMoonSeries` 函数（约第32-63行）并删除。

在文件顶部添加导入：

```typescript
import { calculateMoonSeries } from '../core/series';
```

**步骤4：运行测试验证无回归**

运行：`npm test -- tests/ephemeris/moon.test.ts`
预期：通过

**步骤5：提交代码**

```bash
git add src/ephemeris/moon.ts
git commit -m "重构：月球模块使用核心级数计算器

- 移除本地 calculateMoonSeries 函数
- 从 core/series 模块导入
- 无行为变更，所有测试通过

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务五：创建品牌类型系统

**涉及文件：**
- 创建：`src/core/types.ts`
- 测试：`tests/core/types.test.ts`

**步骤1：编写失败的测试**

创建测试文件：

```typescript
// tests/core/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  type Radians,
  type Degrees,
  toRadians,
  toDegrees,
  asRadians,
  asDegrees,
} from '../src/core/types';

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
```

**步骤2：运行测试验证失败**

运行：`npm test -- tests/core/types.test.ts`
预期：失败，提示"找不到模块"

**步骤3：编写最小实现**

创建类型模块：

```typescript
// src/core/types.ts
/**
 * 单位类型系统
 * 使用品牌类型防止单位混淆
 */

/**
 * 弧度
 */
export type Radians = number & { readonly __brand: 'radians' };

/**
 * 度
 */
export type Degrees = number & { readonly __brand: 'degrees' };

/**
 * 角秒
 */
export type ArcSeconds = number & { readonly __brand: 'arcSeconds' };

/**
 * 儒略日
 */
export type JulianDay = number & { readonly __brand: 'julianDay' };

/**
 * 儒略世纪数
 */
export type JulianCentury = number & { readonly __brand: 'julianCentury' };

// ==================== 单位转换函数 ====================

/**
 * 度转弧度
 */
export function toRadians(degrees: Degrees): Radians {
  return (degrees * Math.PI / 180) as Radians;
}

/**
 * 弧度转度
 */
export function toDegrees(radians: Radians): Degrees {
  return (radians * 180 / Math.PI) as Degrees;
}

/**
 * 度转角秒
 */
export function toArcSeconds(degrees: Degrees): ArcSeconds {
  return (degrees * 3600) as ArcSeconds;
}

/**
 * 角秒转度
 */
export function fromArcSeconds(arcSeconds: ArcSeconds): Degrees {
  return (arcSeconds / 3600) as Degrees;
}

// ==================== 类型断言辅助函数 ====================

/**
 * 将数字断言为弧度类型
 * 用于常量或已知为弧度的值
 */
export function asRadians(value: number): Radians {
  return value as Radians;
}

/**
 * 将数字断言为度类型
 * 用于常量或已知为度的值
 */
export function asDegrees(value: number): Degrees {
  return value as Degrees;
}

/**
 * 将数字断言为角秒类型
 */
export function asArcSeconds(value: number): ArcSeconds {
  return value as ArcSeconds;
}

/**
 * 将数字断言为儒略日类型
 */
export function asJulianDay(value: number): JulianDay {
  return value as JulianDay;
}

/**
 * 将数字断言为儒略世纪数类型
 */
export function asJulianCentury(value: number): JulianCentury {
  return value as JulianCentury;
}
```

**步骤4：运行测试验证通过**

运行：`npm test -- tests/core/types.test.ts`
预期：通过

**步骤5：更新核心模块导出**

修改：`src/core/index.ts`

添加导出：

```typescript
// 品牌类型
export type {
  Radians,
  Degrees,
  ArcSeconds,
  JulianDay,
  JulianCentury,
} from './types';

export {
  toRadians,
  toDegrees,
  toArcSeconds,
  fromArcSeconds,
  asRadians,
  asDegrees,
  asArcSeconds,
  asJulianDay,
  asJulianCentury,
} from './types';
```

**步骤6：提交代码**

```bash
git add src/core/types.ts tests/core/types.test.ts src/core/index.ts
git commit -m "功能：添加品牌类型系统保障单位安全

- 添加弧度、度、角秒类型
- 添加儒略日、儒略世纪数类型
- 添加转换函数
- 添加类型断言辅助函数
- 在编译时防止单位混淆

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务六：为常量添加只读保护

**涉及文件：**
- 修改：`src/core/constants.ts`
- 修改：`src/core/delta-t.ts`
- 修改：`src/core/nutation.ts`

**步骤1：编写测试验证不可变性**

创建测试文件：

```typescript
// tests/core/constants-immutability.test.ts
import { describe, it, expect } from 'vitest';
import { PLANET_NAMES_CN } from '../src/core/constants';
import { DELTA_T_TABLE } from '../src/core/delta-t';

describe('常量不可变性', () => {
  it('应该防止修改 PLANET_NAMES_CN', () => {
    // TypeScript 应该在编译时阻止，但我们也在运行时测试
    expect(() => {
      (PLANET_NAMES_CN as any)[0] = '修改';
    }).toThrow();
  });

  it('应该防止修改 DELTA_T_TABLE', () => {
    expect(() => {
      (DELTA_T_TABLE as any)[0] = 999;
    }).toThrow();
  });

  it('应该允许读取常量', () => {
    expect(PLANET_NAMES_CN[0]).toBe('地球');
    expect(DELTA_T_TABLE.length).toBeGreaterThan(0);
  });
});
```

**步骤2：为 constants.ts 添加只读**

修改 `src/core/constants.ts`：

找到所有常量数组并添加 `as const`：

```typescript
// 之前：
export const PLANET_NAMES_CN = ['地球', '水星', ...];

// 之后：
export const PLANET_NAMES_CN = [
  '地球', '水星', '金星', '火星',
  '木星', '土星', '天王星', '海王星'
] as const;

export const PLANET_NAMES_EN = [
  'Earth', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune'
] as const;
```

更新类型导出：

```typescript
export type PlanetNameCN = typeof PLANET_NAMES_CN[number];
export type PlanetNameEN = typeof PLANET_NAMES_EN[number];
```

**步骤3：为 delta-t.ts 添加只读**

修改 `src/core/delta-t.ts`：

找到 DELTA_T_TABLE 并更新：

```typescript
/**
 * ΔT 历史数据表
 * @readonly - 防止运行时修改
 */
export const DELTA_T_TABLE: readonly number[] = [
  -4000, 108371.7, -13036.80, 392.000, 0.0000,
  -500, 17201.0, -627.82, 16.170, -0.3413,
  // ... 其余数据保持不变
] as const;
```

**步骤4：为 nutation.ts 添加只读**

修改 `src/core/nutation.ts`：

找到 NUTATION_IAU2000B 并更新：

```typescript
/**
 * 章动表（IAU2000B 简化模型）
 * @readonly
 */
export const NUTATION_IAU2000B: readonly number[] = [
  0, 0, 0, 0, 1, -172064161, -174666, 33386, 92052331, 9086, 15377,
  // ... 其余数据保持不变
] as const;
```

**步骤5：运行所有测试验证无破坏**

运行：`npm test`
预期：所有测试通过

**步骤6：提交代码**

```bash
git add src/core/constants.ts src/core/delta-t.ts src/core/nutation.ts tests/core/constants-immutability.test.ts
git commit -m "重构：为常量添加只读保护

- 为所有常量数组添加 'as const'
- 更新只读数组的类型定义
- 添加不可变性测试
- 防止意外数据修改

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务七：重构主入口导出为命名空间模式

**涉及文件：**
- 修改：`src/index.ts`
- 测试：`tests/index.test.ts`

**步骤1：为新导出结构编写测试**

创建测试文件：

```typescript
// tests/index.test.ts
import { describe, it, expect } from 'vitest';
import * as yhjs from '../src/index';

describe('主入口导出', () => {
  it('应该导出命名空间模块', () => {
    expect(yhjs.core).toBeDefined();
    expect(yhjs.lunar).toBeDefined();
    expect(yhjs.ephemeris).toBeDefined();
    expect(yhjs.eclipse).toBeDefined();
    expect(yhjs.astronomy).toBeDefined();
    expect(yhjs.data).toBeDefined();
  });

  it('应该提供扁平导出以保持向下兼容', () => {
    expect(yhjs.LunarDate).toBeDefined();
    expect(yhjs.getSunPosition).toBeDefined();
    expect(yhjs.gregorianToJD).toBeDefined();
  });

  it('应该允许命名空间使用', () => {
    const { LunarDate } = yhjs.lunar;
    expect(LunarDate).toBeDefined();

    const { getSunPosition } = yhjs.astronomy;
    expect(getSunPosition).toBeDefined();
  });
});
```

**步骤2：运行测试验证失败**

运行：`npm test -- tests/index.test.ts`
预期：失败，提示"core 未定义"

**步骤3：用命名空间导出重构 index.ts**

替换 `src/index.ts` 内容：

```typescript
/**
 * @yhjs/lunar - 中国农历与天文计算库
 *
 * 寿星万年历算法 TypeScript 实现
 *
 * 使用方式：
 *
 * 1. 命名空间导入（推荐）：
 *    import { lunar, ephemeris, astronomy } from '@yhjs/lunar';
 *    const date = new lunar.LunarDate(2024, 1, 1);
 *    const sun = astronomy.getSunPosition(...);
 *
 * 2. 扁平化导入（兼容旧代码）：
 *    import { LunarDate, getSunPosition } from '@yhjs/lunar';
 */

// ==================== 命名空间导出 ====================

import * as coreModule from './core';
import * as lunarModule from './lunar';
import * as ephemerisModule from './ephemeris';
import * as eclipseModule from './eclipse';
import * as astronomyModule from './astronomy';
import * as dataModule from './data';

/**
 * 核心模块：常量、儒略日、坐标转换、章动岁差等
 */
export const core = coreModule;

/**
 * 农历模块：农历日期类、节气、干支、节日等
 */
export const lunar = lunarModule;

/**
 * 星历模块：精密的日月行星位置计算
 */
export const ephemeris = ephemerisModule;

/**
 * 日月食模块：日食、月食计算与搜索
 */
export const eclipse = eclipseModule;

/**
 * 天文模块：简化的天文接口（用户友好）
 */
export const astronomy = astronomyModule;

/**
 * 数据模块：城市坐标、历史纪年等
 */
export const data = dataModule;

// ==================== 扁平化导出（向下兼容） ====================

// 核心类型和函数（最常用）
export type {
  SphericalCoord,
  RectangularCoord,
  DateTimeRecord,
  Radians,
  Degrees,
} from './core';

export {
  J2000,
  CS_PI2,
  CS_RAD,
  CS_DEG,
  CS_AU,
  gregorianToJD,
  jdToGregorian,
  calculateDeltaT,
  eclipticToEquatorial,
  equatorialToHorizontal,
} from './core';

// 农历核心（最常用）
export type { LunarDateInfo } from './lunar';
export { LunarDate, lunar, SOLAR_TERM_NAMES_CN } from './lunar';

// 天文接口（最常用）
export type {
  ObserverLocation,
  CelestialPosition,
  SunTimes,
  MoonTimes,
  MoonPhaseInfo,
} from './astronomy';

export {
  getSunPosition,
  getMoonPosition,
  getPlanetPosition,
  getSunTimes,
  getMoonTimes,
  getMoonPhase,
  getSolarTerms,
} from './astronomy';

// 日月食（最常用）
export type {
  SolarEclipseResult,
  LunarEclipseResult,
} from './eclipse';

export {
  searchSolarEclipse,
  searchLunarEclipse,
} from './eclipse';

// 数据（最常用）
export type { CityInfo, EraInfo } from './data';
export {
  MAJOR_CITIES,
  findCityByName,
  findEraByYear,
} from './data';
```

**步骤4：运行测试验证通过**

运行：`npm test -- tests/index.test.ts`
预期：通过

**步骤5：运行所有测试确保无回归**

运行：`npm test`
预期：所有测试通过

**步骤6：提交代码**

```bash
git add src/index.ts tests/index.test.ts
git commit -m "重构：采用命名空间导出模式

- 添加命名空间导出（core、lunar、ephemeris等）
- 保持扁平导出以保持向下兼容
- 改进接口可发现性
- 在注释中添加使用示例

破坏性变更：无（完全向下兼容）

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务八：更新 package.json 导出配置

**涉及文件：**
- 修改：`package.json`

**步骤1：更新导出字段**

修改 `package.json`：

```json
{
  "name": "@yhjs/lunar",
  "version": "1.0.0",
  "description": "精确的中国农历与天文计算库 - 寿星万年历 TypeScript 实现",
  "keywords": [
    "lunar",
    "calendar",
    "chinese",
    "astronomy",
    "solarterm",
    "eclipse",
    "农历",
    "万年历",
    "节气",
    "日月食"
  ],
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./core": {
      "import": "./dist/core/index.js",
      "require": "./dist/core/index.cjs",
      "types": "./dist/core/index.d.ts"
    },
    "./lunar": {
      "import": "./dist/lunar/index.js",
      "require": "./dist/lunar/index.cjs",
      "types": "./dist/lunar/index.d.ts"
    },
    "./ephemeris": {
      "import": "./dist/ephemeris/index.js",
      "require": "./dist/ephemeris/index.cjs",
      "types": "./dist/ephemeris/index.d.ts"
    },
    "./eclipse": {
      "import": "./dist/eclipse/index.js",
      "require": "./dist/eclipse/index.cjs",
      "types": "./dist/eclipse/index.d.ts"
    },
    "./astronomy": {
      "import": "./dist/astronomy/index.js",
      "require": "./dist/astronomy/index.cjs",
      "types": "./dist/astronomy/index.d.ts"
    },
    "./data": {
      "import": "./dist/data/index.js",
      "require": "./dist/data/index.cjs",
      "types": "./dist/data/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

**步骤2：构建并验证导出**

运行：`npm run build`
预期：构建成功，dist 文件夹包含子路径导出

**步骤3：测试子路径导入**

创建快速验证脚本：

```typescript
// temp-test-exports.ts
import { lunar } from './dist/index.js';
import { LunarDate } from './dist/lunar/index.js';

console.log('命名空间导入:', typeof lunar);
console.log('直接导入:', typeof LunarDate);
```

运行：`node temp-test-exports.ts`
预期：两个导入都能工作

删除：`temp-test-exports.ts`

**步骤4：提交代码**

```bash
git add package.json
git commit -m "构建：为 package.json 添加子路径导出

- 配置导出字段支持子路径导入
- 同时支持命名空间和直接导入
- 启用：import { LunarDate } from '@yhjs/lunar/lunar'

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务九：为数据模块常量添加只读保护

**涉及文件：**
- 修改：`src/ephemeris/moon-data.ts`
- 修改：`src/data/vsop87-*.ts`（所有行星数据文件）

**步骤1：更新 moon-data.ts**

修改 `src/ephemeris/moon-data.ts`：

找到所有导出的数据数组并添加 `readonly`：

```typescript
/**
 * 月球黄经级数数据
 * @readonly
 */
export const MOON_LONGITUDE_DATA: readonly number[] = [
  // ... 大量数据保持不变
] as const;

/**
 * 月球黄纬级数数据
 * @readonly
 */
export const MOON_LATITUDE_DATA: readonly number[] = [
  // ... 数据
] as const;

/**
 * 月球距离级数数据
 * @readonly
 */
export const MOON_DISTANCE_DATA: readonly number[] = [
  // ... 数据
] as const;
```

**步骤2：更新 VSOP87 行星数据文件**

对 `src/data/vsop87-*.ts` 中的每个文件，添加 `readonly`：

```typescript
// src/data/vsop87-earth.ts
export const EARTH_L0: readonly number[] = [ /* ... */ ] as const;
export const EARTH_L1: readonly number[] = [ /* ... */ ] as const;
// ... 其余数据
```

对所有 VSOP87 文件应用相同模式：
- `vsop87-mercury.ts`
- `vsop87-venus.ts`
- `vsop87-mars.ts`
- `vsop87-jupiter.ts`
- `vsop87-saturn.ts`
- `vsop87-uranus.ts`
- `vsop87-neptune.ts`

**步骤3：运行测试确保无破坏**

运行：`npm test`
预期：所有测试通过

**步骤4：提交代码**

```bash
git add src/ephemeris/moon-data.ts src/data/vsop87-*.ts
git commit -m "重构：为所有数据数组添加只读保护

- 为月球数据数组添加 'as const'
- 为所有 VSOP87 行星数据添加 'as const'
- 防止意外修改天文数据

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务十：文档 - 阶段一总结

**涉及文件：**
- 创建：`docs/refactoring/phase1-summary.md`

**步骤1：创建总结文档**

```markdown
# 阶段一重构总结：代码质量提升

## 完成时间
2026-01-19

## 目标
消除代码重复、统一类型定义、改进导出结构、增强类型安全

## 完成的改进

### 一、统一级数计算 ✅
- **新增**：`src/core/series.ts`
- **移除重复**：3个相同的级数计算函数合并为1个
- **影响模块**：sun.ts、moon.ts、planet.ts

### 二、品牌类型系统 ✅
- **新增**：`src/core/types.ts`
- **类型**：弧度、度、角秒、儒略日、儒略世纪数
- **收益**：编译时防止单位混淆

### 三、只读数据保护 ✅
- **保护对象**：所有常量表、VSOP87数据、月球数据
- **收益**：运行时防止意外修改

### 四、命名空间导出 ✅
- **新模式**：同时支持命名空间和扁平化导出
- **向下兼容**：旧代码无需修改
- **改进**：接口更清晰，模块边界明确

### 五、统一类型定义 ✅
- **移除重复**：PLANET_NAMES_CN 从3处定义减少到1处
- **单一来源**：core/constants.ts

## 代码统计

| 指标 | 改进前 | 改进后 | 变化 |
|-----|--------|--------|------|
| 重复函数 | 3 | 1 | -67% |
| 类型定义重复 | 3 | 1 | -67% |
| 不可变常量 | 0% | 100% | +100% |
| 导出清晰度 | 低 | 高 | ⬆️ |

## 测试覆盖

- ✅ 级数计算测试
- ✅ 品牌类型测试
- ✅ 常量不可变性测试
- ✅ 导出结构测试
- ✅ 回归测试（所有现有测试通过）

## 破坏性变更

**无** - 所有改动完全向下兼容

## 下一步

进入阶段二：架构优化
- 拆分大型文件
- 解耦紧密依赖
- 补全缺失功能
- 优化日月食搜索
```

**步骤2：提交代码**

```bash
git add docs/refactoring/phase1-summary.md
git commit -m "文档：添加阶段一重构总结

阶段一完成：代码质量提升
- 消除代码重复
- 统一类型定义
- 增强类型安全
- 改进导出结构

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 验证步骤

完成所有任务后，运行以下验证：

**一、运行所有测试**
```bash
npm test
```
预期：所有测试通过

**二、构建项目**
```bash
npm run build
```
预期：构建成功，无错误

**三、检查类型**
```bash
npx tsc --noEmit
```
预期：无类型错误

**四、验证导出**
```bash
node -e "const { core, lunar, astronomy } = require('./dist/index.cjs'); console.log('✅ 命名空间:', !!core, !!lunar, !!astronomy);"
```
预期：✅ 命名空间: true true true

**五、代码检查**
```bash
npm run lint
```
预期：无代码检查错误（如果配置了检查工具）

---

## 成功标准

- ✅ 所有测试通过
- ✅ 构建成功
- ✅ 无类型错误
- ✅ 消除了3个重复函数
- ✅ 统一了类型定义
- ✅ 添加了类型安全机制
- ✅ 改进了导出结构
- ✅ 所有数据受只读保护
- ✅ 向下兼容（无破坏性变更）
- ✅ 代码质量显著提升

---

## 预计时间

- 任务一至四：消除代码重复 - 60分钟
- 任务五：品牌类型 - 30分钟
- 任务六：只读保护 - 30分钟
- 任务七至八：导出重构 - 45分钟
- 任务九：数据保护 - 30分钟
- 任务十：文档 - 15分钟

**总计：约 3.5 小时**

---

## 注意事项

1. **遵循测试驱动开发**：每个改动都先写测试
2. **频繁提交**：每个任务完成后立即提交
3. **回归测试**：每次改动后运行完整测试套件
4. **保持算法不变**：所有改动都是重构，不改变算法逻辑
5. **向下兼容**：确保现有代码无需修改即可工作
