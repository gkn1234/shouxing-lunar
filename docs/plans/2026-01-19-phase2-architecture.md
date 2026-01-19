# 阶段二：架构优化实施计划

> **给 Claude 的指令：** 必须使用 superpowers:executing-plans 技能来逐任务实施本计划。

**目标：** 拆分大型文件、解耦紧密依赖、补全缺失功能、优化性能

**架构方案：** 按职责拆分农历日期类为三个文件，提取朔气核心计算到独立模块，实现完整的晨昏光计算，优化日月食搜索策略，完善类型文档。

**技术栈：** TypeScript 5.3+、Vitest 测试框架、Vite 构建工具

**前置条件：** 阶段一必须已完成

---

## 任务一：拆分农历日期类 - 核心部分

**涉及文件：**
- 创建：`src/lunar/lunar-date-core.ts`
- 修改：`src/lunar/lunar-date.ts`
- 测试：`tests/lunar/lunar-date-core.test.ts`

**步骤1：编写核心类测试**

创建测试文件：

```typescript
// tests/lunar/lunar-date-core.test.ts
import { describe, it, expect } from 'vitest';
import { LunarDateCore } from '../src/lunar/lunar-date-core';

describe('LunarDateCore', () => {
  it('应该从公历日期创建', () => {
    const date = new LunarDateCore(2024, 2, 10);
    expect(date).toBeDefined();
  });

  it('应该从Date对象创建', () => {
    const jsDate = new Date(2024, 1, 10); // 月份从0开始
    const date = new LunarDateCore(jsDate);
    expect(date).toBeDefined();
  });

  it('应该从字符串创建', () => {
    const date = new LunarDateCore('2024-02-10');
    expect(date).toBeDefined();
  });

  it('应该转换为儒略日', () => {
    const date = new LunarDateCore(2024, 2, 10);
    const jd = date.toJulianDay();
    expect(jd).toBeGreaterThan(2460000); // J2000之后
  });

  it('应该转换为Date对象', () => {
    const date = new LunarDateCore(2024, 2, 10);
    const jsDate = date.toDate();
    expect(jsDate.getFullYear()).toBe(2024);
    expect(jsDate.getMonth()).toBe(1); // 月份从0开始
    expect(jsDate.getDate()).toBe(10);
  });

  it('应该懒加载农历信息', () => {
    const date = new LunarDateCore(2024, 2, 10);
    const info1 = date.getLunarInfo();
    const info2 = date.getLunarInfo();
    expect(info1).toBe(info2); // 应该是同一个对象（缓存）
  });
});
```

**步骤2：运行测试验证失败**

运行：`npm test -- tests/lunar/lunar-date-core.test.ts`
预期：失败，提示"找不到模块"

**步骤3：编写核心类实现**

创建核心类文件：

```typescript
// src/lunar/lunar-date-core.ts
/**
 * 农历日期核心类 - 数据存储和基础方法
 *
 * 来源：寿星万年历 lunar.js
 * @see lunar.js:724-895 Lunar类
 */

import { J2000 } from '../core/constants';
import { gregorianToJD, jdToGregorian } from '../core/julian';
import { getLunarDateInfo, type LunarDateInfo } from './calendar';

/**
 * 农历日期核心类
 *
 * 职责：
 * - 存储儒略日数据
 * - 提供构造函数
 * - 提供基础转换方法
 * - 懒加载农历信息
 */
export class LunarDateCore {
  /** 儒略日（从J2000起算） */
  protected jd: number;

  /** 农历信息缓存 */
  protected lunarInfo: LunarDateInfo | null = null;

  /**
   * 构造函数
   *
   * @param input - Date对象、字符串、或年份数字
   * @param month - 月份（1-12）
   * @param day - 日期（1-31）
   */
  constructor(input: Date | string | number, month?: number, day?: number) {
    if (input instanceof Date) {
      this.jd = this.dateToJd(input);
    } else if (typeof input === 'string') {
      this.jd = this.parseString(input);
    } else if (typeof input === 'number' && month !== undefined && day !== undefined) {
      this.jd = gregorianToJD(input, month, day) - J2000 - 0.5;
    } else {
      throw new Error('参数无效：必须提供 Date、字符串、或（年、月、日）');
    }
  }

  // ==================== 基础方法 ====================

  /**
   * 获取儒略日
   */
  toJulianDay(): number {
    return this.jd + J2000 + 0.5;
  }

  /**
   * 转换为Date对象
   */
  toDate(): Date {
    const [y, m, d] = jdToGregorian(this.jd + J2000 + 0.5);
    return new Date(y, m - 1, d);
  }

  /**
   * 获取农历信息（懒加载）
   */
  protected getLunarInfo(): LunarDateInfo {
    if (!this.lunarInfo) {
      this.lunarInfo = getLunarDateInfo(this.jd);
    }
    return this.lunarInfo;
  }

  /**
   * 获取数值表示（时间戳）
   */
  valueOf(): number {
    return this.toDate().getTime();
  }

  // ==================== 私有辅助方法 ====================

  /**
   * Date对象转儒略日
   */
  private dateToJd(date: Date): number {
    const jd = gregorianToJD(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    const dayFraction = (
      date.getHours() +
      date.getMinutes() / 60 +
      date.getSeconds() / 3600
    ) / 24;
    return jd - J2000 - 0.5 + dayFraction;
  }

  /**
   * 字符串转儒略日
   */
  private parseString(str: string): number {
    // 支持 YYYY-MM-DD 格式
    const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) {
      throw new Error(`日期字符串格式无效：${str}，应为 YYYY-MM-DD`);
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    return gregorianToJD(year, month, day) - J2000 - 0.5;
  }
}
```

**步骤4：运行测试验证通过**

运行：`npm test -- tests/lunar/lunar-date-core.test.ts`
预期：通过，所有测试变绿

**步骤5：提交代码**

```bash
git add src/lunar/lunar-date-core.ts tests/lunar/lunar-date-core.test.ts
git commit -m "重构：提取农历日期核心类

- 创建 LunarDateCore 处理基础数据和方法
- 支持多种构造方式（Date、字符串、年月日）
- 实现儒略日转换
- 实现农历信息懒加载
- 为后续拆分做准备

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务二：拆分农历日期类 - 获取方法

**涉及文件：**
- 创建：`src/lunar/lunar-date-getters.ts`
- 测试：`tests/lunar/lunar-date-getters.test.ts`

**步骤1：编写获取方法测试**

创建测试文件：

```typescript
// tests/lunar/lunar-date-getters.test.ts
import { describe, it, expect } from 'vitest';
import { LunarDateWithGetters } from '../src/lunar/lunar-date-getters';

describe('LunarDateWithGetters', () => {
  const date = new LunarDateWithGetters(2024, 2, 10); // 甲辰年正月初一

  describe('公历获取方法', () => {
    it('应该获取公历年', () => {
      expect(date.year()).toBe(2024);
    });

    it('应该获取公历月', () => {
      expect(date.month()).toBe(2);
    });

    it('应该获取公历日', () => {
      expect(date.date()).toBe(10);
    });

    it('应该获取星期', () => {
      const day = date.day();
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThan(7);
    });
  });

  describe('农历获取方法', () => {
    it('应该获取农历年', () => {
      expect(date.lunarYear()).toBe(2024);
    });

    it('应该获取农历月', () => {
      expect(date.lunarMonth()).toBeGreaterThan(0);
      expect(date.lunarMonth()).toBeLessThanOrEqual(12);
    });

    it('应该获取农历日', () => {
      expect(date.lunarDate()).toBeGreaterThan(0);
      expect(date.lunarDate()).toBeLessThanOrEqual(30);
    });

    it('应该判断是否闰月', () => {
      const isLeap = date.isLeapMonth();
      expect(typeof isLeap).toBe('boolean');
    });
  });

  describe('干支获取方法', () => {
    it('应该获取干支年', () => {
      const gz = date.ganZhiYear();
      expect(gz).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    });

    it('应该获取干支月', () => {
      const gz = date.ganZhiMonth();
      expect(gz).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    });

    it('应该获取干支日', () => {
      const gz = date.ganZhiDay();
      expect(gz).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    });

    it('应该获取干支时', () => {
      const gz = date.ganZhiHour(12); // 午时
      expect(gz).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    });
  });

  describe('其他信息获取', () => {
    it('应该获取生肖', () => {
      const zodiac = date.zodiac();
      expect(zodiac).toMatch(/^[鼠牛虎兔龙蛇马羊猴鸡狗猪]$/);
    });

    it('应该获取星座', () => {
      const constellation = date.constellation();
      expect(constellation.length).toBeGreaterThan(0);
    });

    it('应该获取节气', () => {
      const term = date.solarTerm();
      // 可能为null（不是节气日）
      if (term !== null) {
        expect(typeof term).toBe('string');
      }
    });
  });
});
```

**步骤2：运行测试验证失败**

运行：`npm test -- tests/lunar/lunar-date-getters.test.ts`
预期：失败

**步骤3：编写获取方法实现**

创建获取方法文件：

```typescript
// src/lunar/lunar-date-getters.ts
/**
 * 农历日期获取方法
 *
 * 所有的 year()、month()、lunarYear() 等获取方法
 */

import { LunarDateCore } from './lunar-date-core';
import { jdToGregorian } from '../core/julian';
import {
  getYearGanZhi,
  getMonthGanZhi,
  getDayGanZhi,
  getHourGanZhi,
  getShengXiao,
  getXingZuo,
} from './gan-zhi';

/**
 * 带获取方法的农历日期类
 */
export class LunarDateWithGetters extends LunarDateCore {
  // ==================== 公历日期获取 ====================

  /**
   * 获取公历年
   */
  year(): number {
    const [y] = jdToGregorian(this.toJulianDay());
    return y;
  }

  /**
   * 获取公历月（1-12）
   */
  month(): number {
    const [, m] = jdToGregorian(this.toJulianDay());
    return m;
  }

  /**
   * 获取公历日（1-31）
   */
  date(): number {
    const [, , d] = jdToGregorian(this.toJulianDay());
    return d;
  }

  /**
   * 获取星期（0=周日，6=周六）
   */
  day(): number {
    return Math.floor(this.toJulianDay() + 1.5) % 7;
  }

  // ==================== 农历日期获取 ====================

  /**
   * 获取农历年
   */
  lunarYear(): number {
    return this.getLunarInfo().year;
  }

  /**
   * 获取农历月（1-12）
   */
  lunarMonth(): number {
    return this.getLunarInfo().month;
  }

  /**
   * 获取农历日（1-30）
   */
  lunarDate(): number {
    return this.getLunarInfo().day;
  }

  /**
   * 是否闰月
   */
  isLeapMonth(): boolean {
    return this.getLunarInfo().isLeapMonth;
  }

  // ==================== 干支获取 ====================

  /**
   * 获取干支年（如"甲辰"）
   */
  ganZhiYear(): string {
    return getYearGanZhi(this.lunarYear());
  }

  /**
   * 获取干支月
   */
  ganZhiMonth(): string {
    const info = this.getLunarInfo();
    return info.monthGanZhi || getMonthGanZhi(this.ganZhiYear(), this.lunarMonth());
  }

  /**
   * 获取干支日
   */
  ganZhiDay(): string {
    return getDayGanZhi(this.toJulianDay());
  }

  /**
   * 获取干支时
   * @param hour - 小时（0-23），不提供则使用当前时刻
   */
  ganZhiHour(hour?: number): string {
    const h = hour ?? this.toDate().getHours();
    return getHourGanZhi(this.ganZhiDay(), h);
  }

  // ==================== 其他信息 ====================

  /**
   * 获取生肖（如"龙"）
   */
  zodiac(): string {
    return getShengXiao(this.lunarYear());
  }

  /**
   * 获取星座（如"水瓶座"）
   */
  constellation(): string {
    return getXingZuo(this.month(), this.date());
  }

  /**
   * 获取当日节气
   * @returns 节气名称，如果不是节气日则返回null
   */
  solarTerm(): string | null {
    return this.getLunarInfo().solarTerm;
  }
}
```

**步骤4：运行测试验证通过**

运行：`npm test -- tests/lunar/lunar-date-getters.test.ts`
预期：通过

**步骤5：提交代码**

```bash
git add src/lunar/lunar-date-getters.ts tests/lunar/lunar-date-getters.test.ts
git commit -m "重构：提取农历日期获取方法

- 创建 LunarDateWithGetters 类
- 实现所有公历获取方法
- 实现所有农历获取方法
- 实现干支获取方法
- 实现生肖、星座、节气获取

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务三：拆分农历日期类 - 操作方法

**涉及文件：**
- 创建：`src/lunar/lunar-date-methods.ts`
- 测试：`tests/lunar/lunar-date-methods.test.ts`

**步骤1：编写操作方法测试**

创建测试文件：

```typescript
// tests/lunar/lunar-date-methods.test.ts
import { describe, it, expect } from 'vitest';
import { LunarDateFull } from '../src/lunar/lunar-date-methods';

describe('LunarDateFull操作方法', () => {
  describe('add方法', () => {
    it('应该增加天数', () => {
      const date = new LunarDateFull(2024, 2, 10);
      const newDate = date.add(5, 'day');
      expect(newDate.date()).toBe(15);
    });

    it('应该增加月份', () => {
      const date = new LunarDateFull(2024, 2, 10);
      const newDate = date.add(1, 'month');
      expect(newDate.month()).toBe(3);
    });

    it('应该增加年份', () => {
      const date = new LunarDateFull(2024, 2, 10);
      const newDate = date.add(1, 'year');
      expect(newDate.year()).toBe(2025);
    });
  });

  describe('subtract方法', () => {
    it('应该减少天数', () => {
      const date = new LunarDateFull(2024, 2, 10);
      const newDate = date.subtract(5, 'day');
      expect(newDate.date()).toBe(5);
    });
  });

  describe('format方法', () => {
    const date = new LunarDateFull(2024, 2, 10);

    it('应该格式化公历日期', () => {
      const formatted = date.format('YYYY-MM-DD');
      expect(formatted).toBe('2024-02-10');
    });

    it('应该格式化农历日期', () => {
      const formatted = date.format('农历lYYYY年lMM月lDD');
      expect(formatted).toContain('农历');
      expect(formatted).toContain('年');
      expect(formatted).toContain('月');
    });

    it('应该格式化干支', () => {
      const formatted = date.format('GY年GM月GD日');
      expect(formatted).toMatch(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]年/);
    });
  });

  describe('比较方法', () => {
    const date1 = new LunarDateFull(2024, 2, 10);
    const date2 = new LunarDateFull(2024, 2, 15);
    const date3 = new LunarDateFull(2024, 2, 10);

    it('isBefore应该正确比较', () => {
      expect(date1.isBefore(date2)).toBe(true);
      expect(date2.isBefore(date1)).toBe(false);
    });

    it('isAfter应该正确比较', () => {
      expect(date2.isAfter(date1)).toBe(true);
      expect(date1.isAfter(date2)).toBe(false);
    });

    it('isSame应该正确比较', () => {
      expect(date1.isSame(date3, 'day')).toBe(true);
      expect(date1.isSame(date2, 'day')).toBe(false);
      expect(date1.isSame(date2, 'month')).toBe(true);
    });

    it('diff应该计算差值', () => {
      expect(date2.diff(date1, 'day')).toBe(5);
      expect(date1.diff(date2, 'day')).toBe(-5);
    });
  });
});
```

**步骤2：运行测试验证失败**

运行：`npm test -- tests/lunar/lunar-date-methods.test.ts`
预期：失败

**步骤3：编写操作方法实现**

创建操作方法文件：

```typescript
// src/lunar/lunar-date-methods.ts
/**
 * 农历日期操作方法
 *
 * add()、subtract()、format() 等
 */

import { LunarDateWithGetters } from './lunar-date-getters';
import { gregorianToJD, jdToGregorian } from '../core/julian';
import { J2000 } from '../core/constants';
import { LUNAR_MONTH_NAMES } from './solar-term';

/**
 * 农历日名称
 */
const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

/**
 * 完整功能的农历日期类
 */
export class LunarDateFull extends LunarDateWithGetters {
  // ==================== 日期操作 ====================

  /**
   * 增加时间
   * @param value - 数值
   * @param unit - 单位：'day'、'month'、'year'、'lunarMonth'
   */
  add(value: number, unit: 'day' | 'month' | 'year' | 'lunarMonth'): LunarDateFull {
    let newJd = this.jd;

    switch (unit) {
      case 'day':
        newJd += value;
        break;

      case 'month': {
        const [y, m, d] = jdToGregorian(this.toJulianDay());
        const totalMonths = y * 12 + m + value;
        const newYear = Math.floor((totalMonths - 1) / 12);
        const newMonth = ((totalMonths - 1) % 12) + 1;
        newJd = gregorianToJD(newYear, newMonth, d) - J2000 - 0.5;
        break;
      }

      case 'year': {
        const [y, m, d] = jdToGregorian(this.toJulianDay());
        newJd = gregorianToJD(y + value, m, d) - J2000 - 0.5;
        break;
      }

      case 'lunarMonth':
        // 农历月加减较复杂，暂时按30天近似
        newJd += value * 30;
        break;
    }

    const result = Object.create(LunarDateFull.prototype);
    result.jd = newJd;
    result.lunarInfo = null;
    return result;
  }

  /**
   * 减少时间
   */
  subtract(value: number, unit: 'day' | 'month' | 'year' | 'lunarMonth'): LunarDateFull {
    return this.add(-value, unit);
  }

  // ==================== 格式化 ====================

  /**
   * 格式化输出
   *
   * 占位符：
   * - YYYY: 公历年（4位）
   * - MM: 公历月（2位）
   * - DD: 公历日（2位）
   * - lYYYY: 农历年
   * - lMM: 农历月（中文）
   * - lDD: 农历日（中文）
   * - GY: 干支年
   * - GM: 干支月
   * - GD: 干支日
   */
  format(template: string): string {
    let result = template;

    // 公历占位符
    result = result.replace(/YYYY/g, String(this.year()).padStart(4, '0'));
    result = result.replace(/MM/g, String(this.month()).padStart(2, '0'));
    result = result.replace(/DD/g, String(this.date()).padStart(2, '0'));

    // 农历占位符
    result = result.replace(/lYYYY/g, String(this.lunarYear()));
    result = result.replace(/lMM/g, LUNAR_MONTH_NAMES[this.lunarMonth() - 1] || '');
    result = result.replace(/lDD/g, LUNAR_DAY_NAMES[this.lunarDate() - 1] || '');

    // 干支占位符
    result = result.replace(/GY/g, this.ganZhiYear());
    result = result.replace(/GM/g, this.ganZhiMonth());
    result = result.replace(/GD/g, this.ganZhiDay());

    return result;
  }

  // ==================== 比较方法 ====================

  /**
   * 是否早于另一个日期
   */
  isBefore(other: LunarDateFull): boolean {
    return this.toJulianDay() < other.toJulianDay();
  }

  /**
   * 是否晚于另一个日期
   */
  isAfter(other: LunarDateFull): boolean {
    return this.toJulianDay() > other.toJulianDay();
  }

  /**
   * 是否与另一个日期相同
   * @param other - 另一个日期
   * @param unit - 比较单位：'day'、'month'、'year'
   */
  isSame(other: LunarDateFull, unit: 'day' | 'month' | 'year'): boolean {
    switch (unit) {
      case 'day':
        return Math.floor(this.toJulianDay()) === Math.floor(other.toJulianDay());
      case 'month':
        return this.year() === other.year() && this.month() === other.month();
      case 'year':
        return this.year() === other.year();
      default:
        return false;
    }
  }

  /**
   * 计算与另一个日期的差值
   * @param other - 另一个日期
   * @param unit - 单位：'day'、'month'、'year'
   */
  diff(other: LunarDateFull, unit: 'day' | 'month' | 'year'): number {
    const jdDiff = this.toJulianDay() - other.toJulianDay();

    switch (unit) {
      case 'day':
        return Math.floor(jdDiff);
      case 'month':
        return (this.year() - other.year()) * 12 + (this.month() - other.month());
      case 'year':
        return this.year() - other.year();
      default:
        return 0;
    }
  }
}
```

**步骤4：运行测试验证通过**

运行：`npm test -- tests/lunar/lunar-date-methods.test.ts`
预期：通过

**步骤5：提交代码**

```bash
git add src/lunar/lunar-date-methods.ts tests/lunar/lunar-date-methods.test.ts
git commit -m "重构：提取农历日期操作方法

- 创建 LunarDateFull 类
- 实现 add/subtract 日期操作
- 实现 format 格式化输出
- 实现 isBefore/isAfter/isSame 比较
- 实现 diff 差值计算

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务四：重新组装农历日期类

**涉及文件：**
- 修改：`src/lunar/lunar-date.ts`
- 修改：`src/lunar/index.ts`

**步骤1：备份原有测试**

运行：`npm test -- tests/lunar/lunar-date.test.ts`
预期：记录当前所有测试结果作为基线

**步骤2：重写主导出文件**

修改 `src/lunar/lunar-date.ts`：

```typescript
// src/lunar/lunar-date.ts
/**
 * 农历日期主导出
 *
 * 来源：寿星万年历 lunar.js
 * @see lunar.js:724-895 Lunar类
 */

import { LunarDateFull } from './lunar-date-methods';
import { getLunarDateInfo, type LunarDateInfo } from './calendar';
import { gregorianToJD } from '../core/julian';
import { J2000 } from '../core/constants';

/**
 * 农历日期类
 *
 * @example
 * ```ts
 * // 从公历创建
 * const d1 = new LunarDate(2024, 2, 10);
 * const d2 = new LunarDate(new Date());
 * const d3 = new LunarDate('2024-02-10');
 *
 * // 从农历创建
 * const d4 = LunarDate.fromLunar(2024, 1, 1);
 * const d5 = LunarDate.fromLunar(2024, 6, 15, true); // 闰月
 *
 * // 获取信息
 * d1.year();          // 公历年
 * d1.lunarYear();     // 农历年
 * d1.ganZhiYear();    // 干支年
 * d1.zodiac();        // 生肖
 *
 * // 日期操作
 * d1.add(1, 'day');
 * d1.format('YYYY-MM-DD');
 * ```
 */
export class LunarDate extends LunarDateFull {
  /**
   * 从农历日期创建
   *
   * @param year - 农历年
   * @param month - 农历月（1-12）
   * @param day - 农历日（1-30）
   * @param isLeapMonth - 是否闰月
   */
  static fromLunar(
    year: number,
    month: number,
    day: number,
    isLeapMonth: boolean = false
  ): LunarDate {
    // 简化实现：通过遍历查找对应的公历日期
    // 从农历年初开始搜索
    const startJd = gregorianToJD(year, 1, 1) - J2000 - 0.5;

    for (let offset = 0; offset < 400; offset++) {
      const jd = startJd + offset;
      const info = getLunarDateInfo(jd);

      if (
        info.year === year &&
        info.month === month &&
        info.day === day &&
        info.isLeapMonth === isLeapMonth
      ) {
        const result = Object.create(LunarDate.prototype);
        result.jd = jd;
        result.lunarInfo = info;
        return result;
      }
    }

    throw new Error(`找不到对应的农历日期：${year}年${isLeapMonth ? '闰' : ''}${month}月${day}日`);
  }

  /**
   * 从儒略日创建
   *
   * @param jd - 儒略日
   */
  static fromJulianDay(jd: number): LunarDate {
    const result = Object.create(LunarDate.prototype);
    result.jd = jd - J2000 - 0.5;
    result.lunarInfo = null;
    return result;
  }
}

/**
 * 便捷函数：创建农历日期
 *
 * @example
 * ```ts
 * const now = lunar();
 * const d1 = lunar('2024-02-10');
 * const d2 = lunar(2024, 2, 10);
 * ```
 */
export function lunar(
  input?: Date | string | number,
  month?: number,
  day?: number
): LunarDate {
  if (input === undefined) {
    return new LunarDate(new Date());
  }
  return new LunarDate(input as any, month, day);
}

// 重新导出类型
export type { LunarDateInfo };
```

**步骤3：更新模块导出**

修改 `src/lunar/index.ts`：

```typescript
// src/lunar/index.ts

// 主类和便捷函数
export { LunarDate, lunar } from './lunar-date';
export type { LunarDateInfo } from './calendar';

// 节气相关
export {
  calculateShuoQi,
  SOLAR_TERM_NAMES,
  SOLAR_TERM_NAMES_CN,
  SOLAR_TERM_NAMES_EN,
  LUNAR_MONTH_NAMES,
} from './solar-term';

// 干支相关
export {
  getYearGanZhi,
  getYearGanZhiBySpring,
  getMonthGanZhi,
  getDayGanZhi,
  getHourGanZhi,
  getShengXiao,
  getXingZuo,
  TIAN_GAN,
  DI_ZHI,
  SHENG_XIAO,
} from './gan-zhi';

// 节日相关
export {
  getAllFestivals,
  type DateFestivals,
} from './festival';

// 年历计算
export {
  calculateLunarYear,
  getLunarDateInfo,
  type LunarYearData,
} from './calendar';
```

**步骤4：运行所有测试验证无回归**

运行：`npm test -- tests/lunar/`
预期：所有测试通过

**步骤5：提交代码**

```bash
git add src/lunar/lunar-date.ts src/lunar/index.ts
git commit -m "重构：完成农历日期类拆分重组

- 重写 LunarDate 主导出
- 添加静态工厂方法
- 添加便捷函数 lunar()
- 更新模块导出
- 保持向下兼容，所有测试通过

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务五：创建晨昏光计算模块

**涉及文件：**
- 创建：`src/ephemeris/twilight.ts`
- 测试：`tests/ephemeris/twilight.test.ts`

**步骤1：编写晨昏光测试**

创建测试文件：

```typescript
// tests/ephemeris/twilight.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateTwilight,
  calculateCivilTwilight,
  TwilightType,
} from '../src/ephemeris/twilight';

describe('晨昏光计算', () => {
  // 2024年6月21日，北京
  const jd = 2460483.5; // J2000起算约24年
  const longitude = 116.4;
  const latitude = 39.9;

  it('应该计算民用晨昏光', () => {
    const times = calculateCivilTwilight(jd, longitude, latitude);

    expect(times.dawn).not.toBeNull();
    expect(times.dusk).not.toBeNull();

    if (times.dawn && times.dusk) {
      // 晨光应该早于日出
      // 昏影应该晚于日落
      expect(times.dawn).toBeLessThan(jd);
      expect(times.dusk).toBeGreaterThan(jd);
    }
  });

  it('应该计算不同类型的晨昏光', () => {
    const civil = calculateTwilight(jd, longitude, latitude, TwilightType.Civil);
    const nautical = calculateTwilight(jd, longitude, latitude, TwilightType.Nautical);
    const astronomical = calculateTwilight(jd, longitude, latitude, TwilightType.Astronomical);

    // 航海晨昏光应该比民用晨昏光更早/晚
    if (nautical.dawn && civil.dawn) {
      expect(nautical.dawn).toBeLessThan(civil.dawn);
    }
    if (nautical.dusk && civil.dusk) {
      expect(nautical.dusk).toBeGreaterThan(civil.dusk);
    }

    // 天文晨昏光应该比航海晨昏光更早/晚
    if (astronomical.dawn && nautical.dawn) {
      expect(astronomical.dawn).toBeLessThan(nautical.dawn);
    }
    if (astronomical.dusk && nautical.dusk) {
      expect(astronomical.dusk).toBeGreaterThan(nautical.dusk);
    }
  });

  it('高纬度可能返回null（极昼或极夜）', () => {
    // 北极圈内，夏至可能有极昼
    const arcticLat = 70;
    const times = calculateCivilTwilight(jd, 0, arcticLat);

    // 极昼时可能整晚都有光，因此可能返回null
    // 这个测试只验证不会抛出错误
    expect(times).toBeDefined();
  });
});
```

**步骤2：运行测试验证失败**

运行：`npm test -- tests/ephemeris/twilight.test.ts`
预期：失败

**步骤3：编写晨昏光实现**

创建晨昏光模块：

```typescript
// src/ephemeris/twilight.ts
/**
 * 晨昏蒙影计算
 *
 * 晨昏蒙影是太阳在地平线下时，大气散射产生的光照现象
 *
 * 三种晨昏光定义：
 * - 民用晨昏光：太阳中心在地平线下 6°
 * - 航海晨昏光：太阳中心在地平线下 12°
 * - 天文晨昏光：太阳中心在地平线下 18°
 */

import { calculateSunRiseTransitSet, type RiseTransitSetResult } from './rise-transit-set';

/**
 * 晨昏光类型
 */
export enum TwilightType {
  /** 民用晨昏光：太阳下 6° */
  Civil = -6,
  /** 航海晨昏光：太阳下 12° */
  Nautical = -12,
  /** 天文晨昏光：太阳下 18° */
  Astronomical = -18,
}

/**
 * 晨昏光时刻
 */
export interface TwilightTimes {
  /** 晨光始（黎明） */
  dawn: number | null;
  /** 昏影终（黄昏） */
  dusk: number | null;
}

/**
 * 计算晨昏光时刻
 *
 * @see https://zh.wikipedia.org/wiki/曙暮光
 *
 * @param jd - 儒略日
 * @param longitude - 观测点经度（度）
 * @param latitude - 观测点纬度（度）
 * @param type - 晨昏光类型
 * @returns 晨光始和昏影终时刻
 */
export function calculateTwilight(
  jd: number,
  longitude: number,
  latitude: number,
  type: TwilightType = TwilightType.Civil
): TwilightTimes {
  // 使用自定义地平高度角计算升降
  // 晨昏光的"升起"就是晨光始，"落下"就是昏影终
  const result: RiseTransitSetResult = calculateSunRiseTransitSet(
    jd,
    longitude,
    latitude,
    type // -6, -12, -18 度
  );

  return {
    dawn: result.rise,  // 晨光始 = "升起"时刻（太阳从-6°上升）
    dusk: result.set,   // 昏影终 = "落下"时刻（太阳降至-6°）
  };
}

/**
 * 计算民用晨昏光
 *
 * 民用晨昏光期间，户外活动不需要人工照明
 */
export function calculateCivilTwilight(
  jd: number,
  longitude: number,
  latitude: number
): TwilightTimes {
  return calculateTwilight(jd, longitude, latitude, TwilightType.Civil);
}

/**
 * 计算航海晨昏光
 *
 * 航海晨昏光期间，海平线仍可见，可用于航海定位
 */
export function calculateNauticalTwilight(
  jd: number,
  longitude: number,
  latitude: number
): TwilightTimes {
  return calculateTwilight(jd, longitude, latitude, TwilightType.Nautical);
}

/**
 * 计算天文晨昏光
 *
 * 天文晨昏光期间，天空足够暗可以观测暗弱天体
 */
export function calculateAstronomicalTwilight(
  jd: number,
  longitude: number,
  latitude: number
): TwilightTimes {
  return calculateTwilight(jd, longitude, latitude, TwilightType.Astronomical);
}
```

**步骤4：运行测试验证通过**

运行：`npm test -- tests/ephemeris/twilight.test.ts`
预期：通过

**步骤5：更新星历模块导出**

修改 `src/ephemeris/index.ts`，添加：

```typescript
// 晨昏光
export {
  calculateTwilight,
  calculateCivilTwilight,
  calculateNauticalTwilight,
  calculateAstronomicalTwilight,
  TwilightType,
  type TwilightTimes,
} from './twilight';
```

**步骤6：提交代码**

```bash
git add src/ephemeris/twilight.ts tests/ephemeris/twilight.test.ts src/ephemeris/index.ts
git commit -m "功能：实现晨昏光计算

- 创建 twilight 模块
- 实现民用、航海、天文三种晨昏光
- 基于太阳升降计算
- 添加完整测试覆盖

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务六：更新天文模块补全晨昏光

**涉及文件：**
- 修改：`src/astronomy/astronomy.ts`
- 测试：`tests/astronomy/astronomy.test.ts`

**步骤1：编写补全功能测试**

添加到现有测试文件：

```typescript
// tests/astronomy/astronomy.test.ts
import { describe, it, expect } from 'vitest';
import { getSunTimes } from '../src/astronomy/astronomy';

describe('天文模块晨昏光', () => {
  it('getSunTimes应该返回完整的晨昏光信息', () => {
    const times = getSunTimes('2024-06-21', {
      longitude: 116.4,
      latitude: 39.9,
    });

    expect(times.rise).not.toBeNull();
    expect(times.transit).not.toBeNull();
    expect(times.set).not.toBeNull();

    // 关键：民用晨昏光不应该再是 null
    expect(times.civilDawn).not.toBeNull();
    expect(times.civilDusk).not.toBeNull();

    if (times.civilDawn && times.rise) {
      // 晨光应该早于日出
      expect(times.civilDawn.getTime()).toBeLessThan(times.rise.getTime());
    }

    if (times.civilDusk && times.set) {
      // 昏影应该晚于日落
      expect(times.civilDusk.getTime()).toBeGreaterThan(times.set.getTime());
    }
  });
});
```

**步骤2：运行测试验证失败**

运行：`npm test -- tests/astronomy/astronomy.test.ts`
预期：失败（civilDawn/civilDusk 仍为 null）

**步骤3：修改天文模块实现**

修改 `src/astronomy/astronomy.ts`：

找到 `getSunTimes` 函数，更新实现：

```typescript
import { calculateCivilTwilight } from '../ephemeris/twilight';

/**
 * 获取太阳升降时刻（含晨昏光）
 */
export function getSunTimes(
  date: Date | string | number[],
  location: ObserverLocation
): SunTimes {
  const jd = dateToJd(date);
  const { longitude, latitude } = location;

  // 标准日出日落
  const standard = calculateSunRiseTransitSet(jd, longitude, latitude);

  // 民用晨昏光
  const civil = calculateCivilTwilight(jd, longitude, latitude);

  return {
    rise: jdToDate(standard.rise),
    transit: jdToDate(standard.transit),
    set: jdToDate(standard.set),
    civilDawn: jdToDate(civil.dawn),    // ✅ 不再是 null
    civilDusk: jdToDate(civil.dusk),    // ✅ 不再是 null
  };
}

// 辅助函数：儒略日转 Date（处理 null）
function jdToDate(jd: number | null): Date | null {
  if (jd === null) return null;
  const [y, m, d] = jdToGregorian(jd + J2000 + 0.5);
  const dayFraction = (jd + J2000 + 0.5) % 1;
  const hours = dayFraction * 24;
  const minutes = (hours % 1) * 60;
  const seconds = (minutes % 1) * 60;
  return new Date(y, m - 1, d, Math.floor(hours), Math.floor(minutes), Math.floor(seconds));
}
```

**步骤4：运行测试验证通过**

运行：`npm test -- tests/astronomy/astronomy.test.ts`
预期：通过

**步骤5：提交代码**

```bash
git add src/astronomy/astronomy.ts tests/astronomy/astronomy.test.ts
git commit -m "功能：天文模块补全民用晨昏光

- getSunTimes 返回完整的 civilDawn/civilDusk
- 不再返回 null
- 使用 twilight 模块计算
- 添加测试验证

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务七：完善接口类型文档

**涉及文件：**
- 修改：`src/astronomy/astronomy.ts`
- 修改：`src/core/coordinate.ts`

**步骤1：为天文接口添加详细注释**

修改 `src/astronomy/astronomy.ts` 中的接口定义：

```typescript
/**
 * 观测点位置
 */
export interface ObserverLocation {
  /**
   * 经度
   * @unit 度
   * @range -180 ~ 180
   * @example 116.4074 // 北京
   */
  longitude: number;

  /**
   * 纬度
   * @unit 度
   * @range -90 ~ 90
   * @example 39.9042 // 北京
   */
  latitude: number;

  /**
   * 海拔高度（可选）
   * @unit 米
   * @default 0
   * @example 50 // 海平面以上50米
   */
  altitude?: number;
}

/**
 * 天体位置
 */
export interface CelestialPosition {
  /**
   * 方位角
   * @unit 度
   * @range 0 ~ 360
   * @description 从正北顺时针测量，0=北，90=东，180=南，270=西
   */
  azimuth: number;

  /**
   * 地平高度角
   * @unit 度
   * @range -90 ~ 90
   * @description 地平线以上为正，以下为负
   */
  altitude: number;

  /**
   * 赤经
   * @unit 小时
   * @range 0 ~ 24
   */
  rightAscension: number;

  /**
   * 赤纬
   * @unit 度
   * @range -90 ~ 90
   */
  declination: number;

  /**
   * 黄经
   * @unit 度
   * @range 0 ~ 360
   */
  eclipticLongitude: number;

  /**
   * 黄纬
   * @unit 度
   * @range -90 ~ 90
   */
  eclipticLatitude: number;

  /**
   * 距离
   * @unit 天文单位
   * @description 1 AU ≈ 149,597,870.7 km
   */
  distance: number;
}

/**
 * 太阳升降时刻
 */
export interface SunTimes {
  /**
   * 日出时刻
   * @description 太阳上边缘从地平线升起的时刻
   */
  rise: Date | null;

  /**
   * 中天时刻
   * @description 太阳到达最高点的时刻（正午）
   */
  transit: Date | null;

  /**
   * 日落时刻
   * @description 太阳上边缘从地平线落下的时刻
   */
  set: Date | null;

  /**
   * 民用晨光始
   * @description 太阳中心位于地平线下6°，天空开始发亮
   */
  civilDawn: Date | null;

  /**
   * 民用昏影终
   * @description 太阳中心位于地平线下6°，天空完全变暗
   */
  civilDusk: Date | null;
}
```

**步骤2：为坐标转换函数添加详细注释**

修改 `src/core/coordinate.ts`：

```typescript
/**
 * 黄道坐标转赤道坐标
 *
 * @param longitude - 黄经（弧度）
 * @param latitude - 黄纬（弧度）
 * @param obliquity - 黄赤交角（弧度）
 * @returns [赤经（弧度）, 赤纬（弧度）]
 *
 * @example
 * ```ts
 * const [ra, dec] = eclipticToEquatorial(
 *   asRadians(180 * Math.PI / 180),  // 黄经180°
 *   asRadians(0),                     // 黄纬0°
 *   asRadians(23.4 * Math.PI / 180)  // 黄赤交角23.4°
 * );
 * ```
 */
export function eclipticToEquatorial(
  longitude: number,
  latitude: number,
  obliquity: number
): [number, number] {
  // ... 实现保持不变
}
```

**步骤3：提交代码**

```bash
git add src/astronomy/astronomy.ts src/core/coordinate.ts
git commit -m "文档：完善接口类型注释

- 为所有公共接口添加详细注释
- 标注单位、范围、默认值
- 添加使用示例
- 提升API可理解性

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务八：文档 - 阶段二总结

**涉及文件：**
- 创建：`docs/refactoring/phase2-summary.md`

**步骤1：创建总结文档**

```markdown
# 阶段二重构总结：架构优化

## 完成时间
2026-01-19

## 目标
拆分大型文件、解耦紧密依赖、补全缺失功能、优化性能

## 完成的改进

### 一、拆分农历日期类 ✅
- **拆分前**：单文件508行，职责混杂
- **拆分后**：三个文件，职责清晰
  - `lunar-date-core.ts`：核心数据和基础方法
  - `lunar-date-getters.ts`：所有获取方法
  - `lunar-date-methods.ts`：所有操作方法
- **收益**：可维护性提升，代码组织更清晰

### 二、补全晨昏光计算 ✅
- **新增模块**：`src/ephemeris/twilight.ts`
- **实现功能**：
  - 民用晨昏光（-6°）
  - 航海晨昏光（-12°）
  - 天文晨昏光（-18°）
- **集成**：天文模块的 `getSunTimes` 不再返回 null

### 三、完善类型文档 ✅
- **改进对象**：所有公共接口
- **添加信息**：
  - 单位标注（度、米、天文单位等）
  - 范围说明
  - 默认值
  - 使用示例
- **收益**：API 更易理解和使用

## 代码统计

| 指标 | 改进前 | 改进后 | 变化 |
|-----|--------|--------|------|
| lunar-date.ts | 508行 | 3个文件 | 模块化 |
| 晨昏光功能 | 缺失 | 完整 | +100% |
| 接口文档 | 简单 | 详细 | ⬆️ |
| 单文件最大行数 | 508 | <300 | -40% |

## 测试覆盖

- ✅ 农历日期核心类测试
- ✅ 农历日期获取方法测试
- ✅ 农历日期操作方法测试
- ✅ 晨昏光计算测试
- ✅ 天文模块补全测试
- ✅ 所有现有测试通过（无回归）

## 破坏性变更

**无** - 所有改动完全向下兼容

## 下一步

进入阶段三：性能与完整性
- 添加 LRU 缓存
- 优化级数计算
- 完善性能测试
- 准备发布文档

---

**阶段二完成！代码架构显著优化，功能更加完整。**
```

**步骤2：提交代码**

```bash
git add docs/refactoring/phase2-summary.md
git commit -m "文档：添加阶段二重构总结

阶段二完成：架构优化
- 拆分大型文件
- 补全缺失功能
- 完善类型文档
- 保持向下兼容

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

**二、检查代码覆盖率**
```bash
npm test -- --coverage
```
预期：覆盖率保持或提升

**三、构建项目**
```bash
npm run build
```
预期：构建成功

**四、检查类型**
```bash
npx tsc --noEmit
```
预期：无类型错误

**五、验证功能完整性**
```bash
node -e "
const { getSunTimes } = require('./dist/astronomy/index.cjs');
const times = getSunTimes('2024-06-21', { longitude: 116.4, latitude: 39.9 });
console.log('✅ civilDawn:', times.civilDawn !== null);
console.log('✅ civilDusk:', times.civilDusk !== null);
"
```
预期：✅ civilDawn: true ✅ civilDusk: true

---

## 成功标准

- ✅ 所有测试通过
- ✅ 无类型错误
- ✅ 构建成功
- ✅ 农历日期类拆分为3个文件
- ✅ 晨昏光功能完整实现
- ✅ 天文模块不再返回 null
- ✅ 所有接口有详细文档
- ✅ 向下兼容（无破坏性变更）
- ✅ 代码可维护性显著提升

---

## 预计时间

- 任务一至四：拆分农历日期类 - 90分钟
- 任务五：晨昏光计算 - 45分钟
- 任务六：补全天文模块 - 30分钟
- 任务七：完善类型文档 - 30分钟
- 任务八：文档总结 - 15分钟

**总计：约 3.5 小时**

---

## 注意事项

1. **保持算法不变**：所有改动都是重构，不改变算法逻辑
2. **测试驱动**：每个功能都先写测试
3. **频繁提交**：每个任务完成后立即提交
4. **向下兼容**：确保现有代码无需修改
5. **文档同步**：代码和文档同步更新
