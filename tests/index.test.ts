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

  it('应该提供扁平导出', () => {
    expect(yhjs.gregorianToJD).toBeDefined();
    expect(yhjs.getSunPosition).toBeDefined();
  });

  it('应该允许命名空间使用', () => {
    expect(yhjs.core.gregorianToJD).toBeDefined();
    expect(yhjs.astronomy.getSunPosition).toBeDefined();
  });
});
