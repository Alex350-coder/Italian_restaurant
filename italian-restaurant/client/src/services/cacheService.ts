const DEFAULT_TTL = 5 * 60 * 1000;
const MAX_MEMORY_ENTRIES = 500;
const IDB_DB_NAME = 'cache-service';
const IDB_VERSION = 1;
const IDB_STORE = 'cache-entries';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  idbHits: number;
  memoryHits: number;
  localStorageHits: number;
  totalSize: number;
  entryCount: number;
}

interface IDBCacheEntry {
  key: string;
  data: unknown;
  timestamp: number;
  ttl: number;
  size: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry>;
  private prefix: string;
  private db: IDBDatabase | null;
  private stats: CacheStats;
  private accessOrder: string[];
  private initPromise: Promise<void>;

  constructor(prefix: string = 'cache_') {
    this.memoryCache = new Map();
    this.prefix = prefix;
    this.db = null;
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      idbHits: 0,
      memoryHits: 0,
      localStorageHits: 0,
      totalSize: 0,
      entryCount: 0,
    };
    this.initPromise = this.initIDB();
  }

  private async initIDB(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open(IDB_DB_NAME, IDB_VERSION);

      request.onerror = () => {
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureIDB(): Promise<void> {
    if (!this.db) {
      await this.initPromise;
    }
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getIDBKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private estimateSize(data: unknown): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024;
    }
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    while (this.memoryCache.size > MAX_MEMORY_ENTRIES) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.memoryCache.delete(lruKey);
        this.stats.evictions++;
      }
    }
  }

  private loadFromStorage(key: string): CacheEntry | null {
    try {
      const stored = localStorage.getItem(this.getStorageKey(key));
      if (!stored) return null;
      const entry: CacheEntry = JSON.parse(stored);
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(this.getStorageKey(key));
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  }

  private saveToStorage(key: string, entry: CacheEntry): void {
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
    } catch {
      // Storage full or unavailable
    }
  }

  private async loadFromIDB(key: string): Promise<CacheEntry | null> {
    await this.ensureIDB();
    if (!this.db) return null;

    try {
      const tx = this.db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get(this.getIDBKey(key));

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result as IDBCacheEntry | undefined;
          if (result) {
            if (Date.now() - result.timestamp > result.ttl) {
              this.deleteFromIDB(key);
              resolve(null);
            } else {
              resolve({
                data: result.data,
                timestamp: result.timestamp,
                ttl: result.ttl,
              });
            }
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async saveToIDB(key: string, entry: CacheEntry): Promise<void> {
    await this.ensureIDB();
    if (!this.db) return;

    try {
      const size = this.estimateSize(entry.data);
      const idbEntry: IDBCacheEntry = {
        key: this.getIDBKey(key),
        data: entry.data,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        size,
      };

      const tx = this.db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(idbEntry);
    } catch {
      // silent fail
    }
  }

  private async deleteFromIDB(key: string): Promise<void> {
    await this.ensureIDB();
    if (!this.db) return;

    try {
      const tx = this.db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(this.getIDBKey(key));
    } catch {
      // silent fail
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory first
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (Date.now() - memEntry.timestamp > memEntry.ttl) {
        this.memoryCache.delete(key);
        this.stats.misses++;
        return null;
      }
      this.updateAccessOrder(key);
      this.stats.hits++;
      this.stats.memoryHits++;
      return memEntry.data as T;
    }

    // Check localStorage
    const storageEntry = this.loadFromStorage(key);
    if (storageEntry) {
      this.memoryCache.set(key, storageEntry);
      this.updateAccessOrder(key);
      this.stats.hits++;
      this.stats.localStorageHits++;
      return storageEntry.data as T;
    }

    // Check IndexedDB
    const idbEntry = await this.loadFromIDB(key);
    if (idbEntry) {
      this.memoryCache.set(key, idbEntry);
      this.updateAccessOrder(key);
      this.stats.hits++;
      this.stats.idbHits++;
      return idbEntry.data as T;
    }

    this.stats.misses++;
    return null;
  }

  syncGet<T>(key: string): T | null {
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (Date.now() - memEntry.timestamp > memEntry.ttl) {
        this.memoryCache.delete(key);
        this.stats.misses++;
        return null;
      }
      this.updateAccessOrder(key);
      this.stats.hits++;
      this.stats.memoryHits++;
      return memEntry.data as T;
    }

    const storageEntry = this.loadFromStorage(key);
    if (storageEntry) {
      this.memoryCache.set(key, storageEntry);
      this.updateAccessOrder(key);
      this.stats.hits++;
      this.stats.localStorageHits++;
      return storageEntry.data as T;
    }

    this.stats.misses++;
    return null;
  }

  async set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    this.memoryCache.set(key, entry);
    this.updateAccessOrder(key);
    this.evictLRU();

    this.saveToStorage(key, entry);
    await this.saveToIDB(key, entry);

    this.stats.sets++;
  }

  syncSet<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    this.memoryCache.set(key, entry);
    this.updateAccessOrder(key);
    this.evictLRU();

    this.saveToStorage(key, entry);
    this.saveToIDB(key, entry);

    this.stats.sets++;
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    localStorage.removeItem(this.getStorageKey(key));
    await this.deleteFromIDB(key);
    this.stats.deletes++;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);

    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        this.stats.deletes++;
      }
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(this.prefix)) {
        const cacheKey = storageKey.replace(this.prefix, '');
        if (regex.test(cacheKey)) {
          keysToRemove.push(storageKey);
        }
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    await this.ensureIDB();
    if (this.db) {
      try {
        const tx = this.db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const request = store.openCursor();

        await new Promise<void>((resolve) => {
          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              const cursorKey = cursor.key as string;
              const originalKey = cursorKey.replace(this.prefix, '');
              if (regex.test(originalKey)) {
                cursor.delete();
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = () => resolve();
        });
      } catch {
        // silent fail
      }
    }
  }

  has(key: string): boolean {
    return this.syncGet(key) !== null;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.accessOrder = [];

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    await this.ensureIDB();
    if (this.db) {
      try {
        const tx = this.db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.clear();
      } catch {
        // silent fail
      }
    }
  }

  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttlMs);
    return data;
  }

  getAge(key: string): number | null {
    const entry = this.memoryCache.get(key);
    if (entry) {
      return Date.now() - entry.timestamp;
    }
    const storageEntry = this.loadFromStorage(key);
    if (storageEntry) {
      return Date.now() - storageEntry.timestamp;
    }
    return null;
  }

  getTTL(key: string): number | null {
    const entry = this.memoryCache.get(key);
    if (entry) {
      return entry.ttl;
    }
    const storageEntry = this.loadFromStorage(key);
    if (storageEntry) {
      return storageEntry.ttl;
    }
    return null;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      idbHits: 0,
      memoryHits: 0,
      localStorageHits: 0,
      totalSize: this.stats.totalSize,
      entryCount: this.stats.entryCount,
    };
  }

  async warmCache(entries: Array<{ key: string; fetcher: () => Promise<unknown>; ttl?: number }>): Promise<void> {
    await Promise.allSettled(
      entries.map(async (entry) => {
        const cached = await this.get(entry.key);
        if (!cached) {
          try {
            const data = await entry.fetcher();
            await this.set(entry.key, data, entry.ttl);
          } catch {
            // silent fail
          }
        }
      })
    );
  }

  async getIDBSize(): Promise<number> {
    await this.ensureIDB();
    if (!this.db) return 0;

    let totalSize = 0;

    try {
      const tx = this.db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.openCursor();

      await new Promise<void>((resolve) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            totalSize += (cursor.value as IDBCacheEntry).size || 0;
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => resolve();
      });
    } catch {
      // silent fail
    }

    return totalSize;
  }

  async getIDBEntryCount(): Promise<number> {
    await this.ensureIDB();
    if (!this.db) return 0;

    try {
      const tx = this.db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.count();
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  getMemorySize(): number {
    return this.memoryCache.size;
  }

  destroy(): void {
    this.memoryCache.clear();
    this.accessOrder = [];
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
