import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

class TestCacheService {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 300000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  getSize(): number {
    return this.cache.size;
  }
}

describe("CacheService", () => {
  let cache: TestCacheService;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new TestCacheService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("set and get", () => {
    it("should store and retrieve a value", () => {
      cache.set("key1", { name: "test" });

      const result = cache.get("key1");

      expect(result).toEqual({ name: "test" });
    });

    it("should store different data types", () => {
      cache.set("string", "hello");
      cache.set("number", 42);
      cache.set("boolean", true);
      cache.set("array", [1, 2, 3]);
      cache.set("object", { nested: { value: "deep" } });

      expect(cache.get("string")).toBe("hello");
      expect(cache.get("number")).toBe(42);
      expect(cache.get("boolean")).toBe(true);
      expect(cache.get("array")).toEqual([1, 2, 3]);
      expect(cache.get("object")).toEqual({ nested: { value: "deep" } });
    });

    it("should return null for non-existent keys", () => {
      const result = cache.get("nonexistent");

      expect(result).toBeNull();
    });

    it("should overwrite existing values", () => {
      cache.set("key1", "first");
      cache.set("key1", "second");

      expect(cache.get("key1")).toBe("second");
    });

    it("should track cache size", () => {
      expect(cache.getSize()).toBe(0);

      cache.set("a", 1);
      expect(cache.getSize()).toBe(1);

      cache.set("b", 2);
      expect(cache.getSize()).toBe(2);

      cache.set("a", 3);
      expect(cache.getSize()).toBe(2);
    });
  });

  describe("TTL expiration", () => {
    it("should return null after TTL expires", () => {
      cache.set("key1", "value1", 5000);

      vi.advanceTimersByTime(5001);

      expect(cache.get("key1")).toBeNull();
    });

    it("should return data before TTL expires", () => {
      cache.set("key1", "value1", 10000);

      vi.advanceTimersByTime(9999);

      expect(cache.get("key1")).toBe("value1");
    });

    it("should use default TTL when not specified", () => {
      cache.set("key1", "value1");

      vi.advanceTimersByTime(300000 - 1);
      expect(cache.get("key1")).toBe("value1");

      vi.advanceTimersByTime(2);
      expect(cache.get("key1")).toBeNull();
    });

    it("should allow different TTLs for different keys", () => {
      cache.set("short", "value", 1000);
      cache.set("long", "value", 100000);

      vi.advanceTimersByTime(1001);

      expect(cache.get("short")).toBeNull();
      expect(cache.get("long")).toBe("value");
    });

    it("should auto-clean on get after expiration", () => {
      cache.set("key1", "value1", 5000);
      expect(cache.getSize()).toBe(1);

      vi.advanceTimersByTime(5001);
      cache.get("key1");

      expect(cache.getSize()).toBe(0);
    });
  });

  describe("invalidate", () => {
    it("should remove a specific key", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      cache.invalidate("key1");

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBe("value2");
    });

    it("should handle invalidating non-existent keys gracefully", () => {
      expect(() => cache.invalidate("nonexistent")).not.toThrow();
    });
  });

  describe("invalidatePattern", () => {
    it("should remove all keys matching the pattern", () => {
      cache.set("menu:pizza", [1, 2, 3]);
      cache.set("menu:pasta", [4, 5, 6]);
      cache.set("menu:dessert", [7, 8, 9]);
      cache.set("user:123", { name: "test" });

      cache.invalidatePattern("^menu:");

      expect(cache.get("menu:pizza")).toBeNull();
      expect(cache.get("menu:pasta")).toBeNull();
      expect(cache.get("menu:dessert")).toBeNull();
      expect(cache.get("user:123")).toEqual({ name: "test" });
    });

    it("should handle no matching keys", () => {
      cache.set("key1", "value1");

      cache.invalidatePattern("^xyz:");

      expect(cache.get("key1")).toBe("value1");
    });

    it("should handle partial pattern matches", () => {
      cache.set("order_123", "a");
      cache.set("order_456", "b");
      cache.set("reservation_789", "c");

      cache.invalidatePattern("order_");

      expect(cache.get("order_123")).toBeNull();
      expect(cache.get("order_456")).toBeNull();
      expect(cache.get("reservation_789")).toBe("c");
    });
  });

  describe("clear", () => {
    it("should remove all cached entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      cache.clear();

      expect(cache.getSize()).toBe(0);
      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
      expect(cache.get("key3")).toBeNull();
    });

    it("should work on empty cache", () => {
      expect(() => cache.clear()).not.toThrow();
      expect(cache.getSize()).toBe(0);
    });
  });

  describe("prefetch", () => {
    it("should fetch and cache data on miss", async () => {
      const fetcher = vi.fn().mockResolvedValue({ items: ["a", "b"] });

      const result = await cache.prefetch("key1", fetcher);

      expect(result).toEqual({ items: ["a", "b"] });
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(cache.get("key1")).toEqual({ items: ["a", "b"] });
    });

    it("should return cached data without calling fetcher on hit", async () => {
      cache.set("key1", { cached: true });
      const fetcher = vi.fn().mockResolvedValue({ fresh: true });

      const result = await cache.prefetch("key1", fetcher);

      expect(result).toEqual({ cached: true });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should use default TTL for prefetched data", async () => {
      const fetcher = vi.fn().mockResolvedValue("data");

      await cache.prefetch("key1", fetcher);

      vi.advanceTimersByTime(300000 - 1);
      expect(cache.get("key1")).toBe("data");

      vi.advanceTimersByTime(2);
      expect(cache.get("key1")).toBeNull();
    });

    it("should use custom TTL when provided", async () => {
      const fetcher = vi.fn().mockResolvedValue("data");

      await cache.prefetch("key1", fetcher, 5000);

      vi.advanceTimersByTime(5001);
      expect(cache.get("key1")).toBeNull();
    });

    it("should call fetcher again after TTL expires", async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce("first")
        .mockResolvedValueOnce("second");

      const result1 = await cache.prefetch("key1", fetcher, 5000);
      expect(result1).toBe("first");

      vi.advanceTimersByTime(5001);

      const result2 = await cache.prefetch("key1", fetcher, 5000);
      expect(result2).toBe("second");
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("should propagate fetcher errors", async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(cache.prefetch("key1", fetcher)).rejects.toThrow("Network error");
    });
  });
});
