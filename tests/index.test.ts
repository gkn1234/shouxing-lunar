import { describe, it, expect } from 'vitest';
import * as yhjs from '../src/index';

describe('主入口导出', () => {
  it('应该提供扁平导出 - 核心模块', () => {
    expect(yhjs.gregorianToJD).toBeDefined();
    expect(yhjs.jdToGregorian).toBeDefined();
    expect(yhjs.J2000).toBeDefined();
  });

  it('应该提供扁平导出 - 农历模块', () => {
    expect(yhjs.LunarDate).toBeDefined();
    expect(yhjs.lunar).toBeDefined();
    expect(yhjs.calculateLunarYear).toBeDefined();
  });

  it('应该提供扁平导出 - 天文模块', () => {
    expect(yhjs.getSunPosition).toBeDefined();
    expect(yhjs.getMoonPosition).toBeDefined();
    expect(yhjs.getSunTimes).toBeDefined();
  });

  it('应该提供扁平导出 - 星历模块', () => {
    expect(yhjs.calculateSunApparentLongitude).toBeDefined();
    expect(yhjs.calculateMoonApparentLongitude).toBeDefined();
  });

  it('应该提供扁平导出 - 日月食模块', () => {
    expect(yhjs.findSolarEclipses).toBeDefined();
    expect(yhjs.findLunarEclipses).toBeDefined();
  });

  it('应该提供扁平导出 - 数据模块', () => {
    expect(yhjs.PROVINCES).toBeDefined();
    expect(yhjs.DYNASTIES).toBeDefined();
  });

  it('应该提供扁平导出 - 晨昏光模块', () => {
    expect(yhjs.TwilightType).toBeDefined();
    expect(yhjs.calculateTwilight).toBeDefined();
    expect(yhjs.calculateCivilTwilight).toBeDefined();
  });

  it('应该提供扁平导出 - 缓存模块', () => {
    expect(yhjs.LRUCache).toBeDefined();
    expect(yhjs.memoize).toBeDefined();
  });
});
