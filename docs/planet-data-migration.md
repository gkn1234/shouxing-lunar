# 行星 VSOP87 数据迁移计划

## 概述

将 `eph0.js` 中的 `XL0` 数组行星数据迁移到独立的 TypeScript 文件中。

## 数据来源

源文件：`src-legacy/eph0.js`

由于 `eph0.js` 文件过大（约 4000+ 行），无法一次性读取，需要分段读取：

```bash
# 读取特定行范围
sed -n '700,800p' src-legacy/eph0.js
```

## XL0 数组结构

`XL0` 是一个二维数组，包含 8 个行星的 VSOP87 数据：

| 索引 | 行星 | 英文 | 目标文件 | 状态 |
|-----|------|------|----------|------|
| 0 | 地球 | Earth | `vsop87-earth.ts` | ✅ 已完成 |
| 1 | 水星 | Mercury | `vsop87-mercury.ts` | ✅ 已完成 |
| 2 | 金星 | Venus | `vsop87-venus.ts` | ⏳ 待迁移 |
| 3 | 火星 | Mars | `vsop87-mars.ts` | ⏳ 待迁移 |
| 4 | 木星 | Jupiter | `vsop87-jupiter.ts` | ⏳ 待迁移 |
| 5 | 土星 | Saturn | `vsop87-saturn.ts` | ⏳ 待迁移 |
| 6 | 天王星 | Uranus | `vsop87-uranus.ts` | ⏳ 待迁移 |
| 7 | 海王星 | Neptune | `vsop87-neptune.ts` | ⏳ 待迁移 |

## 每个行星数据的行号范围（eph0.js）

需要通过以下方式定位每个行星数据：

```bash
# 查找 XL0 数组开始位置
grep -n "XL0=" src-legacy/eph0.js

# 查找各行星数据分隔（通常有注释或空行）
grep -n "//.*星" src-legacy/eph0.js
```

## 数据文件模板

每个行星数据文件应遵循以下结构：

```typescript
/**
 * VSOP87 [行星名]星历数据 - [Planet Name] Ephemeris Data
 *
 * 来源：寿星万年历 eph0.js XL0[索引]
 * @see eph0.js:行号范围
 *
 * 精度: J2000±4千年
 *
 * 数据格式:
 * - 每3个数为一组: [振幅A, 相位B, 频率C]
 * - 计算公式: A * cos(B + C*t), t为儒略千年数
 */

/**
 * 数据倍率 (振幅需除以此值)
 */
export const PLANET_MULTIPLIER = 1000000000; // 或 10000000000

/**
 * 位置索引表
 * 索引含义:
 * - [0-5]: L0-L5 黄经数据起始位置
 * - [6-11]: B0-B5 黄纬数据起始位置
 * - [12-18]: R0-R5 距离数据起始位置, 结束位置
 */
export const PLANET_INDEX = [
  // L0-L5 起始位置
  // B0-B5 起始位置
  // R0-R5 起始位置, 结束位置
];

// === 黄经数据 L ===

export const PLANET_L0: number[] = [
  // 从 eph0.js 复制数据
];

export const PLANET_L1: number[] = [];
export const PLANET_L2: number[] = [];
export const PLANET_L3: number[] = [];
export const PLANET_L4: number[] = [];
export const PLANET_L5: number[] = [];

// === 黄纬数据 B ===

export const PLANET_B0: number[] = [];
export const PLANET_B1: number[] = [];
export const PLANET_B2: number[] = [];
export const PLANET_B3: number[] = [];
export const PLANET_B4: number[] = [];
export const PLANET_B5: number[] = [];

// === 距离数据 R ===

export const PLANET_R0: number[] = [];
export const PLANET_R1: number[] = [];
export const PLANET_R2: number[] = [];
export const PLANET_R3: number[] = [];
export const PLANET_R4: number[] = [];
export const PLANET_R5: number[] = [];

// === 组合数组 ===

export const PLANET_L = [PLANET_L0, PLANET_L1, PLANET_L2, PLANET_L3, PLANET_L4, PLANET_L5];
export const PLANET_B = [PLANET_B0, PLANET_B1, PLANET_B2, PLANET_B3, PLANET_B4, PLANET_B5];
export const PLANET_R = [PLANET_R0, PLANET_R1, PLANET_R2, PLANET_R3, PLANET_R4, PLANET_R5];
```

## 数据提取步骤

### 1. 定位数据范围

```bash
# 查看文件行数
wc -l src-legacy/eph0.js

# 搜索 XL0 定义
grep -n "XL0\s*=" src-legacy/eph0.js
```

### 2. 理解原始数据结构

原始 `XL0[n]` 结构：
- 前 19-20 个数字是索引表（INDEX）
- 第一个数字通常是倍率（MULTIPLIER）
- 剩余数据按索引表分割为 L0-L5, B0-B5, R0-R5

### 3. 分段读取

```bash
# 示例：读取第 700-800 行
sed -n '700,800p' src-legacy/eph0.js

# 或使用 head/tail 组合
head -n 800 src-legacy/eph0.js | tail -n 100
```

### 4. 数据拆分规则

根据 INDEX 数组拆分数据：
- `data[INDEX[0]]` 到 `data[INDEX[1]-1]` → L0
- `data[INDEX[1]]` 到 `data[INDEX[2]-1]` → L1
- ... 以此类推
- `data[INDEX[6]]` 到 `data[INDEX[7]-1]` → B0
- ...
- `data[INDEX[12]]` 到 `data[INDEX[13]-1]` → R0
- ...

## 注意事项

1. **不要简化数据** - 保持原始精度，不要省略任何项
2. **保持格式一致** - 参考 `vsop87-earth.ts` 和 `vsop87-mercury.ts` 的格式
3. **验证数据完整性** - 迁移后确保数组长度与索引表匹配
4. **命名规范** - 使用大写常量名，如 `VENUS_L0`, `MARS_B1` 等

## 后续工作

完成数据迁移后，需要：

1. 更新 `planet.ts` 使用实际 VSOP87 数据替代简化的开普勒轨道
2. 在 `ephemeris/index.ts` 中导出新的数据模块
3. 添加针对每个行星的精度测试

## 参考资料

- VSOP87 理论: https://en.wikipedia.org/wiki/VSOP_(planets)
- 原始数据来源: Bureau des Longitudes, Paris
