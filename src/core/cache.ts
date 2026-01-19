/**
 * LRU 缓存实现
 *
 * 最近最少使用（Least Recently Used）缓存
 */

/**
 * 缓存节点（内部使用）
 */
class CacheNode<K, V> {
  key: K;
  value: V;
  prev: CacheNode<K, V> | null = null;
  next: CacheNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

/**
 * LRU 缓存类
 *
 * 使用双向链表 + Map 实现 O(1) 时间复杂度的访问和淘汰
 *
 * @template K - 键类型
 * @template V - 值类型
 *
 * @example
 * ```ts
 * const cache = new LRUCache<string, number>(100);
 * cache.set('key1', 42);
 * const value = cache.get('key1'); // 42
 * ```
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V> | null = null;
  private tail: CacheNode<K, V> | null = null;
  private hits: number = 0;
  private misses: number = 0;

  /**
   * 创建 LRU 缓存实例
   *
   * @param capacity - 缓存容量，默认 100
   */
  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * 获取缓存值
   *
   * @param key - 缓存键
   * @returns 缓存值，如果不存在则返回 undefined
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) {
      this.misses++;
      return undefined;
    }

    this.hits++;
    // 移动到头部（最近使用）
    this.moveToHead(node);
    return node.value;
  }

  /**
   * 设置缓存值
   *
   * @param key - 缓存键
   * @param value - 缓存值
   */
  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // 更新已存在的节点
      existingNode.value = value;
      this.moveToHead(existingNode);
      return;
    }

    // 创建新节点
    const newNode = new CacheNode(key, value);
    this.cache.set(key, newNode);
    this.addToHead(newNode);

    // 检查是否需要淘汰
    if (this.cache.size > this.capacity) {
      this.evictLRU();
    }
  }

  /**
   * 删除缓存项
   *
   * @param key - 缓存键
   * @returns 是否删除成功
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  /**
   * 检查键是否存在
   *
   * 注意：此方法不会更新访问顺序
   *
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存命中率
   *
   * @returns 命中率 (0-1)，如果没有访问则返回 0
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    if (total === 0) {
      return 0;
    }
    return this.hits / total;
  }

  /**
   * 获取缓存统计信息
   *
   * @returns 统计信息对象
   */
  getStats(): {
    size: number;
    capacity: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return {
      size: this.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
    };
  }

  /**
   * 将节点移动到头部
   */
  private moveToHead(node: CacheNode<K, V>): void {
    if (node === this.head) {
      return;
    }

    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * 将节点添加到头部
   */
  private addToHead(node: CacheNode<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * 从链表中移除节点
   */
  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
  }

  /**
   * 淘汰最久未使用的项
   */
  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const lruNode = this.tail;
    this.removeNode(lruNode);
    this.cache.delete(lruNode.key);
  }
}

/**
 * 记忆化配置选项
 */
export interface MemoizeOptions<Args extends unknown[]> {
  /** 缓存大小，默认 100 */
  cacheSize?: number;
  /** 自定义键生成器 */
  keyGenerator?: (...args: Args) => string;
}

/**
 * 默认键生成器
 *
 * 将参数转换为 JSON 字符串作为缓存键
 */
function defaultKeyGenerator<Args extends unknown[]>(...args: Args): string {
  return JSON.stringify(args);
}

/**
 * 创建函数记忆化缓存
 *
 * 将函数的计算结果缓存起来，相同的参数直接返回缓存结果
 *
 * @param fn - 需要缓存的函数
 * @param options - 配置选项
 * @returns 带缓存的函数
 *
 * @example
 * ```ts
 * const expensiveFn = memoize((x: number) => {
 *   // 耗时计算
 *   return x * x;
 * }, { cacheSize: 100 });
 *
 * expensiveFn(10); // 计算并缓存
 * expensiveFn(10); // 直接返回缓存结果
 * ```
 *
 * @example
 * ```ts
 * // 使用自定义键生成器
 * const fn = memoize(
 *   (x: number, y: number) => x + y,
 *   { keyGenerator: (x, y) => `${x}:${y}` }
 * );
 * ```
 */
export function memoize<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  options?: MemoizeOptions<Args>
): (...args: Args) => Return {
  const cacheSize = options?.cacheSize ?? 100;
  const keyGenerator = options?.keyGenerator ?? defaultKeyGenerator;
  const cache = new LRUCache<string, Return>(cacheSize);

  return (...args: Args): Return => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    // 检查是否已缓存但值为 undefined（使用 has 方法）
    if (cache.has(key)) {
      return cached as Return;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
