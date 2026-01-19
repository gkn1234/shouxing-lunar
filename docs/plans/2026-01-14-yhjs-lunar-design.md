# @yhjs/lunar 重构设计方案

> 寿星万年历算法 TypeScript 重构

## 概述

将《寿星万年历》的核心算法从 JavaScript 重构为 TypeScript，发布为 npm 库 `@yhjs/lunar`。

### 设计原则

- 保持原始算法流程不变
- 保留原始数据完整性
- 遵循 Clean Code 风格
- 测试驱动开发 (TDD)
- API 设计参考 dayjs/moment
- **变量命名语义化**

---

## 1.5 命名规范

### 变量命名语义化原则

原始代码中大量使用单字母变量（如 `t`, `n`, `c`, `d` 等），重构时必须使用有意义的名称：

| 原始变量 | 语义化名称 | 说明 |
|---------|-----------|------|
| `t` | `julianCentury` | 儒略世纪数 (J2000起算) |
| `jd` | `julianDay` | 儒略日 |
| `y`, `m`, `d` | `year`, `month`, `day` | 年月日 |
| `L`, `B`, `R` | `longitude`, `latitude`, `distance` | 黄经、黄纬、距离 |
| `ra`, `dec` | `rightAscension`, `declination` | 赤经、赤纬 |
| `E` | `obliquity` / `epsilon` | 黄赤交角 |
| `dL`, `dE` | `nutationLongitude`, `nutationObliquity` | 黄经章动、交角章动 |
| `gst` | `greenwichSiderealTime` | 格林尼治恒星时 |
| `fa` | `latitude` (观测点) | 观测点纬度 |
| `dt` | `deltaT` | 时差 ΔT |

### 函数命名规范

- 使用动词开头：`calculate`, `convert`, `get`, `find`, `to`
- 描述输入输出：`gregorianToJulian`, `eclipticToEquatorial`
- 避免缩写：`calcNutation` → `calculateNutation`

### 常量命名规范

- 使用 UPPER_SNAKE_CASE
- 添加类别前缀：`CS_` (常数), `PLANET_`, `WEEK_`
- 保留物理意义：`CS_AU` (天文单位), `J2000` (纪元)

### 类型命名规范

- 接口使用 PascalCase：`DateTimeRecord`, `SphericalCoord`
- 类型别名描述用途：`JulianDay`, `JulianCentury`

---

## 1. 整体架构

### 1.1 分层架构

```
┌─────────────────────────────────────┐
│           API 层 (对外接口)          │
│  lunar / eclipse / astronomy / data │
└───────────────────┬─────────────────┘
                    │
┌───────────────────┴─────────────────┐
│         Algorithm 层 (专业算法)      │
│      ephemeris / calendar / ssq     │
└───────────────────┬─────────────────┘
                    │
┌───────────────────┴─────────────────┐
│           Core 层 (核心基础)         │
│  constants / julian / coordinate    │
└─────────────────────────────────────┘
```

### 1.2 子路径导出

```typescript
import { LunarDate } from '@yhjs/lunar/lunar';
import { findSolarEclipse } from '@yhjs/lunar/eclipse';
import { getPlanetPosition } from '@yhjs/lunar/astronomy';
import { cities } from '@yhjs/lunar/data';
```

---

## 2. 目录结构

```
@yhjs/lunar/
├── src/
│   ├── core/                     # 核心基础层
│   │   ├── constants.ts          # 天文常数
│   │   ├── julian.ts             # 儒略日计算
│   │   ├── delta-t.ts            # ΔT时差计算
│   │   ├── coordinate.ts         # 坐标系转换
│   │   ├── nutation.ts           # 章动计算
│   │   ├── precession.ts         # 岁差计算
│   │   └── index.ts
│   │
│   ├── ephemeris/                # 星历计算层
│   │   ├── sun.ts                # 太阳位置
│   │   ├── moon.ts               # 月球位置
│   │   ├── planet.ts             # 行星位置
│   │   ├── star.ts               # 恒星计算
│   │   ├── rise-transit-set.ts   # 升中降计算
│   │   └── index.ts
│   │
│   ├── lunar/                    # 农历模块 (对外API)
│   │   ├── lunar-date.ts         # LunarDate 核心类
│   │   ├── solar-term.ts         # 节气计算
│   │   ├── calendar.ts           # 历法转换
│   │   ├── gan-zhi.ts            # 干支计算
│   │   ├── festival.ts           # 节日数据
│   │   └── index.ts
│   │
│   ├── eclipse/                  # 日月食模块 (对外API)
│   │   ├── solar-eclipse.ts      # 日食计算
│   │   ├── lunar-eclipse.ts      # 月食计算
│   │   └── index.ts
│   │
│   ├── astronomy/                # 天文模块 (对外API)
│   │   ├── planet-position.ts    # 行星位置查询
│   │   ├── star-position.ts      # 恒星位置查询
│   │   ├── sun-moon-times.ts     # 日出日落月升月落
│   │   └── index.ts
│   │
│   ├── data/                     # 数据模块
│   │   ├── city-coordinates.ts   # 城市经纬度
│   │   ├── historical-era.ts     # 皇帝纪年
│   │   ├── star-catalog.json     # 恒星库
│   │   └── index.ts
│   │
│   └── index.ts                  # 主入口
│
├── tests/
│   ├── core/
│   ├── lunar/
│   ├── eclipse/
│   ├── astronomy/
│   └── fixtures/                 # 测试数据
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

**文件命名规则：** kebab-case

---

## 3. API 设计

### 3.1 LunarDate 核心类

```typescript
// ==================== 创建实例 ====================

const now = lunar();
const d1 = lunar('2024-02-10');
const d2 = lunar(new Date());
const d3 = lunar(2024, 2, 10);

// 从农历创建
const d4 = lunar.fromLunar(2024, 1, 1);
const d5 = lunar.fromLunar(2024, 6, 15, true);  // 闰月

// ==================== 获取信息 ====================

d1.year();          // 公历年
d1.month();         // 公历月 (1-12)
d1.date();          // 公历日
d1.day();           // 星期 (0-6)

d1.lunarYear();     // 农历年
d1.lunarMonth();    // 农历月
d1.lunarDate();     // 农历日
d1.isLeapMonth();   // 是否闰月

d1.ganZhiYear();    // 干支年: '甲辰'
d1.ganZhiMonth();   // 干支月
d1.ganZhiDay();     // 干支日
d1.ganZhiHour();    // 干支时

d1.zodiac();        // 生肖
d1.constellation(); // 星座

// ==================== 节气与节日 ====================

d1.solarTerm();           // 当日节气
d1.festival();            // 公历节日
d1.lunarFestival();       // 农历节日
d1.nextSolarTerm();       // 下一个节气
d1.getSolarTerms(2024);   // 某年所有节气

// ==================== 格式化 ====================

d1.format('YYYY-MM-DD');
d1.format('农历lYYYY年lMM月lDD');
d1.format('GY年GM月GD日');

d1.toDate();
d1.toJulian();
d1.valueOf();

// ==================== 日期操作 ====================

d1.add(1, 'day');
d1.add(1, 'lunarMonth');
d1.startOf('month');
d1.endOf('lunarMonth');

// ==================== 比较 ====================

d1.isBefore(d2);
d1.isAfter(d2);
d1.isSame(d2, 'day');
d1.diff(d2, 'day');
```

### 3.2 Eclipse 模块

```typescript
import { findSolarEclipse, findLunarEclipse } from '@yhjs/lunar/eclipse';

// 查找日食
const eclipses = findSolarEclipse({ start: '2024-01-01', end: '2024-12-31' });
const next = findSolarEclipse.next('2024-06-01');

// SolarEclipse 对象
interface SolarEclipse {
  type: 'total' | 'annular' | 'partial' | 'hybrid';
  date: LunarDate;
  maxTime: Date;
  magnitude: number;
  getLocalView(lng: number, lat: number): LocalView;
  getPath(): EclipsePath[];
}

// 查找月食
const lunarEclipses = findLunarEclipse({ start: '2024-01-01', end: '2024-12-31' });

interface LunarEclipse {
  type: 'total' | 'partial' | 'penumbral';
  date: LunarDate;
  penumbralStart: Date;
  partialStart?: Date;
  totalStart?: Date;
  maxTime: Date;
  totalEnd?: Date;
  partialEnd?: Date;
  penumbralEnd: Date;
  magnitude: number;
}
```

### 3.3 Astronomy 模块

```typescript
import {
  getSunPosition,
  getMoonPosition,
  getPlanetPosition,
  getSunTimes,
  getMoonTimes,
  getMoonPhase,
} from '@yhjs/lunar/astronomy';

// 天体位置
const sun = getSunPosition('2024-06-21 12:00', { lng: 116.4, lat: 39.9 });
// => { azimuth, altitude, ra, dec, lng, lat, distance }

// 升降时刻
const sunTimes = getSunTimes('2024-06-21', { lng: 116.4, lat: 39.9 });
// => { rise, transit, set, dawn, dusk }

// 月相
const phase = getMoonPhase('2024-06-21');
// => { phase, name, illumination, nextNewMoon, nextFullMoon }
```

---

## 4. 数据处理策略

| 数据类型 | 存储方式 | 示例 |
|---------|---------|------|
| 天文常数 | TypeScript 常量 | `CS_AU`, `J2000` |
| ΔT 表 | TypeScript 数组 | `DELTA_T_TABLE` |
| 城市坐标 | TypeScript 对象 | `CITY_COORDINATES` |
| 恒星库 | JSON 文件 | `star-catalog.json` |

---

## 5. 构建配置

### 5.1 输出格式

- ESM (现代浏览器/Node.js)
- CommonJS (传统 Node.js)
- UMD (CDN 直接引用)

### 5.2 package.json exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./lunar": { ... },
    "./eclipse": { ... },
    "./astronomy": { ... },
    "./data": { ... }
  }
}
```

---

## 6. 测试策略

| 类型 | 目的 | 覆盖范围 |
|------|------|---------|
| 单元测试 | 验证算法正确性 | 所有函数 |
| 对比测试 | 与原代码一致性 | 核心算法 |
| 边界测试 | 极端情况处理 | 闰年、闰月、极端年份 |
| 精度测试 | 验证计算精度 | 日月食、天体位置 |

---

## 7. 实施阶段

### 阶段 1: 项目初始化 + Core 层 ✅

- [x] 项目骨架搭建
- [x] 天文常数迁移
- [x] 儒略日计算
- [x] ΔT 时差计算
- [x] 坐标转换
- [x] 章动/岁差计算

### 阶段 2: Ephemeris 层 ✅

- [x] 太阳位置计算
- [x] 月球位置计算
- [x] 行星位置计算
- [ ] 恒星计算 (暂缓)
- [x] 升中降时刻

### 阶段 3: Lunar 层 ✅

- [x] 节气计算 (SSQ)
- [x] 朔望计算
- [x] 干支计算
- [x] 节日数据
- [x] LunarDate 类

### 阶段 4: Eclipse 层 ⏳

- [x] 月食计算
- [ ] 日食计算

### 阶段 5: 整合与发布 ⏳

- [ ] API 封装
- [ ] Data 模块
- [ ] 文档编写
- [ ] npm 发布

---

## 8. 源代码映射

| 原始文件 | 行数 | 目标模块 |
|---------|------|---------|
| eph0.js | 1565 | core/, ephemeris/sun.ts, ephemeris/moon.ts |
| eph.js | 1550 | ephemeris/, eclipse/ |
| ephB.js | 424 | ephemeris/star.ts |
| lunar.js | 1023 | lunar/ |
| JW.js | 82 | data/ |
| tools.js | 77 | core/ (部分) |

---

## 9. 实施进度跟踪

> 最后更新: 2026-01-18

### 整体完成度: **80%**

```
进度: ████████████████████████████████░░░░ 80%
```

### 模块实现状态

| 模块 | 状态 | 进度 | 文件数 | 代码行数 | 测试用例 |
|------|------|------|--------|---------|---------|
| **Core** | ✅ 完成 | 100% | 7 | 1,479 | 90 |
| **Ephemeris** | ✅ 完成 | 100% | 11 | 3,685 | 126 |
| **Lunar** | ✅ 完成 | 100% | 6 | 1,200+ | 110 |
| **Eclipse** | 🔧 开发中 | 50% | 2 | 300+ | 16 |
| **Astronomy** | ⏳ 待实现 | 0% | 1 | 8 | 0 |
| **Data** | ⏳ 待实现 | 0% | 1 | 8 | 0 |

**统计汇总**:
- 总源代码: 6,700+ 行
- 总测试代码: 2,200+ 行
- 总测试用例: 342+ 个
- 导出项数: 310+

---

### ✅ 阶段 1: 项目初始化 + Core 层 — 已完成

| 任务 | 文件 | 状态 | 行数 |
|------|------|------|------|
| 项目骨架搭建 | `package.json`, `tsconfig.json`, `vite.config.ts` | ✅ | - |
| 天文常数迁移 | `core/constants.ts` | ✅ | 129 |
| 儒略日计算 | `core/julian.ts` | ✅ | 338 |
| ΔT 时差计算 | `core/delta-t.ts` | ✅ | 170 |
| 坐标转换 | `core/coordinate.ts` | ✅ | 245 |
| 章动计算 | `core/nutation.ts` | ✅ | 289 |
| 岁差计算 | `core/precession.ts` | ✅ | 314 |

---

### ✅ 阶段 2: Ephemeris 层 — 已完成

| 任务 | 文件 | 状态 | 行数 |
|------|------|------|------|
| 太阳位置计算 | `ephemeris/sun.ts` | ✅ | 445 |
| 月球位置计算 | `ephemeris/moon.ts` | ✅ | 400 |
| 行星位置计算 | `ephemeris/planet.ts` | ✅ | 363 |
| 升中降时刻 | `ephemeris/rise-transit-set.ts` | ✅ | 419 |
| 月球数据 | `ephemeris/moon-data.ts` | ✅ | 208 |
| VSOP87 地球 | `ephemeris/vsop87-earth.ts` | ✅ | 346 |
| VSOP87 水星 | `ephemeris/vsop87-mercury.ts` | ✅ | 430 |
| VSOP87 金星 | `ephemeris/vsop87-venus.ts` | ✅ | 263 |
| VSOP87 火星 | `ephemeris/vsop87-mars.ts` | ✅ | 464 |
| VSOP87 海王星 | `ephemeris/vsop87-neptune.ts` | ✅ | 197 |

---

### ✅ 阶段 3: Lunar 层 — 已完成

| 任务 | 文件 | 状态 | 行数 |
|------|------|------|------|
| 实朔实气计算 (SSQ) | `lunar/solar-term.ts` | ✅ | 460 |
| 朔望计算 | `lunar/calendar.ts` | ✅ | 305 |
| 干支计算 | `lunar/gan-zhi.ts` | ✅ | 303 |
| 节日数据 | `lunar/festival.ts` | ✅ | 281 |
| LunarDate 核心类 | `lunar/lunar-date.ts` | ✅ | 509 |
| 模块导出 | `lunar/index.ts` | ✅ | 68 |

---

### ⏳ 阶段 4: Eclipse 层 — 开发中

| 任务 | 文件 | 状态 | 行数 |
|------|------|------|------|
| 月食计算 | `eclipse/lunar-eclipse.ts` | ✅ | 300+ |
| 日食计算 | `eclipse/solar-eclipse.ts` | ⏳ | - |

---

### ⏳ 阶段 5: 整合与发布 — 待实现

| 任务 | 文件 | 状态 |
|------|------|------|
| API 封装 | `astronomy/` | ⏳ |
| Data 模块 | `data/` | ⏳ |
| 文档编写 | - | ⏳ |
| npm 发布 | - | ⏳ |

---

### 测试覆盖情况

**Core 模块测试** (689 行, 90 用例):
- `constants.test.ts` - 常数值验证
- `julian.test.ts` - 儒略日转换
- `coordinate.test.ts` - 坐标转换
- `delta-t.test.ts` - ΔT 计算
- `nutation.test.ts` - 章动计算
- `precession.test.ts` - 岁差计算

**Ephemeris 模块测试** (923 行, 126 用例):
- `sun.test.ts` - 太阳位置
- `moon.test.ts` - 月球位置
- `planet.test.ts` - 行星位置
- `rise-transit-set.test.ts` - 升中降时刻

**Lunar 模块测试** (500+ 行, 110 用例):
- `solar-term.test.ts` - 节气计算
- `calendar.test.ts` - 朔望日历
- `gan-zhi.test.ts` - 干支计算
- `festival.test.ts` - 节日数据
- `lunar-date.test.ts` - LunarDate 类

**Eclipse 模块测试** (180+ 行, 16 用例):
- `lunar-eclipse.test.ts` - 月食计算

---

## 附录: 原始代码关键对象

| 对象 | 文件 | 功能 | 目标位置 |
|-----|------|------|---------|
| JD | eph0.js | 儒略日处理 | core/julian.ts |
| XL | eph0.js | 日月星历 | ephemeris/ |
| SSQ | lunar.js | 实朔实气 | lunar/solar-term.ts |
| SZJ | eph.js | 升中降 | ephemeris/rise-transit-set.ts |
| msc | eph.js | 月食快速 | eclipse/lunar-eclipse.ts |
| ysPL | eph.js | 月食详细 | eclipse/lunar-eclipse.ts |
| rsGS | eph.js | 日食几何 | eclipse/solar-eclipse.ts |
| rsPL | eph.js | 日食批量 | eclipse/solar-eclipse.ts |
