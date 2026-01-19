import { describe, it, expect } from 'vitest';
import { LRUCache, memoize } from '../../src/core/cache';

describe('LRUCache', () => {
  it('应该存储和检索值', () => {
    const cache = new LRUCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('应该驱逐最少使用的项', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // 'a' 应该被驱逐
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('访问时应该更新顺序', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // 'a' 变为最近使用
    cache.set('c', 3); // 'b' 应该被驱逐
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('应该跟踪命中率', () => {
    const cache = new LRUCache<string, number>(10);
    cache.set('a', 1);
    cache.get('a'); // 命中
    cache.get('b'); // 未命中
    cache.get('a'); // 命中
    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.667, 2);
  });

  it('应该清空缓存', () => {
    const cache = new LRUCache<string, number>(10);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
    expect(cache.getStats().size).toBe(0);
  });

  describe('has 方法', () => {
    it('应该正确判断键是否存在', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('has 不应该更新访问顺序', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.has('a'); // 检查但不更新顺序
      cache.set('c', 3); // 'a' 应该被驱逐
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
    });
  });

  describe('delete 方法', () => {
    it('应该删除存在的键', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      expect(cache.delete('a')).toBe(true);
      expect(cache.has('a')).toBe(false);
      expect(cache.size).toBe(1);
    });

    it('删除不存在的键应返回 false', () => {
      const cache = new LRUCache<string, number>(3);
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('size 属性', () => {
    it('应该返回正确的缓存大小', () => {
      const cache = new LRUCache<string, number>(5);
      expect(cache.size).toBe(0);
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      cache.set('b', 2);
      expect(cache.size).toBe(2);
    });
  });

  describe('getHitRate 方法', () => {
    it('无访问时应返回 0', () => {
      const cache = new LRUCache<string, number>(10);
      expect(cache.getHitRate()).toBe(0);
    });

    it('全部命中时应返回 1', () => {
      const cache = new LRUCache<string, number>(10);
      cache.set('a', 1);
      cache.get('a');
      cache.get('a');
      expect(cache.getHitRate()).toBe(1);
    });
  });

  describe('边界情况', () => {
    it('应该使用默认容量 100', () => {
      const cache = new LRUCache<string, number>();
      const stats = cache.getStats();
      expect(stats.capacity).toBe(100);
    });

    it('更新已存在的键应该更新值和顺序', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('a', 10); // 更新 'a'，'a' 变为最近使用
      cache.set('c', 3); // 'b' 应该被驱逐
      expect(cache.get('a')).toBe(10);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
    });

    it('容量为 1 时应该正常工作', () => {
      const cache = new LRUCache<string, number>(1);
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
      cache.set('b', 2);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
    });
  });
});

describe('memoize', () => {
  it('应该缓存函数结果', () => {
    let callCount = 0;
    const fn = memoize((x: number) => {
      callCount++;
      return x * 2;
    });
    expect(fn(5)).toBe(10);
    expect(fn(5)).toBe(10);
    expect(callCount).toBe(1);
  });

  it('应该使用自定义键生成器', () => {
    let callCount = 0;
    const fn = memoize(
      (x: number, y: number) => {
        callCount++;
        return x + y;
      },
      { keyGenerator: (x, y) => `${x}:${y}` }
    );
    expect(fn(1, 2)).toBe(3);
    expect(fn(1, 2)).toBe(3);
    expect(callCount).toBe(1);
  });

  it('应该尊重缓存大小限制', () => {
    let callCount = 0;
    const fn = memoize(
      (x: number) => {
        callCount++;
        return x * 2;
      },
      { cacheSize: 2 }
    );
    fn(1); // 缓存：[1]
    fn(2); // 缓存：[1, 2]
    fn(3); // 缓存：[2, 3]，1被驱逐
    fn(1); // 缓存未命中，需要重新计算
    expect(callCount).toBe(4);
  });

  it('不同参数应该有不同的缓存', () => {
    let callCount = 0;
    const fn = memoize((x: number) => {
      callCount++;
      return x * 2;
    });
    expect(fn(5)).toBe(10);
    expect(fn(10)).toBe(20);
    expect(fn(5)).toBe(10);
    expect(callCount).toBe(2);
  });

  it('默认键生成器应该处理多个参数', () => {
    let callCount = 0;
    const fn = memoize((a: number, b: string, c: boolean) => {
      callCount++;
      return `${a}-${b}-${c}`;
    });
    expect(fn(1, 'test', true)).toBe('1-test-true');
    expect(fn(1, 'test', true)).toBe('1-test-true');
    expect(fn(1, 'test', false)).toBe('1-test-false');
    expect(callCount).toBe(2);
  });

  it('应该正确处理对象参数', () => {
    let callCount = 0;
    const fn = memoize(
      (obj: { x: number }) => {
        callCount++;
        return obj.x * 2;
      },
      { keyGenerator: (obj) => String(obj.x) }
    );
    expect(fn({ x: 5 })).toBe(10);
    expect(fn({ x: 5 })).toBe(10);
    expect(callCount).toBe(1);
  });

  it('应该使用默认缓存大小 100', () => {
    const calls: number[] = [];
    const fn = memoize((x: number) => {
      calls.push(x);
      return x;
    });

    // 添加 100 个不同的值
    for (let i = 0; i < 100; i++) {
      fn(i);
    }

    // 所有值都应该被缓存
    for (let i = 0; i < 100; i++) {
      fn(i);
    }

    expect(calls.length).toBe(100);
  });
});
