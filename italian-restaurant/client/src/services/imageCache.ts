const DB_NAME = 'image-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
  width?: number;
  height?: number;
}

interface ImageCacheConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  enableWebP: boolean;
  placeholderColor: string;
}

const DEFAULT_CONFIG: ImageCacheConfig = {
  maxWidth: 1200,
  maxHeight: 900,
  quality: 0.85,
  enableWebP: true,
  placeholderColor: '#2c2c2c',
};

class ImageCache {
  private db: IDBDatabase | null;
  private config: ImageCacheConfig;
  private memoryCache: Map<string, string>;
  private loadingPromises: Map<string, Promise<string>>;
  private supportsWebP: boolean;

  constructor(config: Partial<ImageCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.db = null;
    this.memoryCache = new Map();
    this.loadingPromises = new Map();
    this.supportsWebP = false;
    this.init();
  }

  private async init(): Promise<void> {
    await this.openDB();
    await this.detectWebP();
    await this.cleanupExpired();
  }

  private async openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  private async detectWebP(): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.supportsWebP = true;
        URL.revokeObjectURL(img.src);
        resolve();
      };
      img.onerror = () => {
        this.supportsWebP = false;
        resolve();
      };
      img.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiTmcAA=';
    });
  }

  private generatePlaceholder(
    width: number,
    height: number,
    color: string = this.config.placeholderColor
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.5);
  }

  async getCachedImage(url: string): Promise<string | null> {
    if (this.memoryCache.has(url)) {
      return this.memoryCache.get(url)!;
    }

    if (!this.db) return null;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(url);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result as CachedImage | undefined;
          if (result) {
            const blobUrl = URL.createObjectURL(result.blob);
            this.memoryCache.set(url, blobUrl);
            resolve(blobUrl);
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

  async cacheImage(url: string): Promise<string> {
    const existing = await this.getCachedImage(url);
    if (existing) return existing;

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = this.fetchAndCache(url);
    this.loadingPromises.set(url, promise);

    try {
      return await promise;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  private async fetchAndCache(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let blob = await response.blob();

      if (this.config.enableWebP && this.supportsWebP) {
        blob = await this.convertToWebP(blob);
      }

      const cachedImage: CachedImage = {
        url,
        blob,
        timestamp: Date.now(),
        size: blob.size,
      };

      await this.storeImage(cachedImage);

      const blobUrl = URL.createObjectURL(blob);
      this.memoryCache.set(url, blobUrl);

      await this.enforceSizeLimit();

      return blobUrl;
    } catch (err) {
      throw err;
    }
  }

  private async convertToWebP(blob: Blob): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const { width, height } = this.calculateDimensions(
          img.naturalWidth,
          img.naturalHeight
        );
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(blob);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (webpBlob) => {
            resolve(webpBlob || blob);
          },
          'image/webp',
          this.config.quality
        );
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(blob);
      img.src = URL.createObjectURL(blob);
    });
  }

  private calculateDimensions(
    naturalWidth: number,
    naturalHeight: number
  ): { width: number; height: number } {
    let width = naturalWidth;
    let height = naturalHeight;

    if (width > this.config.maxWidth) {
      height = Math.round(height * (this.config.maxWidth / width));
      width = this.config.maxWidth;
    }

    if (height > this.config.maxHeight) {
      width = Math.round(width * (this.config.maxHeight / height));
      height = this.config.maxHeight;
    }

    return { width, height };
  }

  private async storeImage(image: CachedImage): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(image);
    } catch {
      // silent fail
    }
  }

  private async enforceSizeLimit(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor();

      let totalSize = 0;
      const images: CachedImage[] = [];

      await new Promise<void>((resolve) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            images.push(cursor.value);
            totalSize += cursor.value.size;
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => resolve();
      });

      if (totalSize > MAX_CACHE_SIZE) {
        const sorted = images.sort((a, b) => a.timestamp - b.timestamp);
        let freed = 0;
        const toRemove: string[] = [];

        for (const img of sorted) {
          if (freed > totalSize - MAX_CACHE_SIZE * 0.8) break;
          toRemove.push(img.url);
          freed += img.size;
        }

        if (toRemove.length > 0) {
          const deleteTx = this.db.transaction(STORE_NAME, 'readwrite');
          const deleteStore = deleteTx.objectStore(STORE_NAME);
          toRemove.forEach((url) => {
            deleteStore.delete(url);
            const blobUrl = this.memoryCache.get(url);
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
              this.memoryCache.delete(url);
            }
          });
        }
      }
    } catch {
      // silent fail
    }
  }

  private async cleanupExpired(): Promise<void> {
    if (!this.db) return;

    const maxAge = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      const expiredUrls: string[] = [];

      await new Promise<void>((resolve) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            expiredUrls.push(cursor.value.url);
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => resolve();
      });

      if (expiredUrls.length > 0) {
        const deleteTx = this.db.transaction(STORE_NAME, 'readwrite');
        const deleteStore = deleteTx.objectStore(STORE_NAME);
        expiredUrls.forEach((url) => {
          deleteStore.delete(url);
          const blobUrl = this.memoryCache.get(url);
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
            this.memoryCache.delete(url);
          }
        });
      }
    } catch {
      // silent fail
    }
  }

  getPlaceholder(width: number = 300, height: number = 200): string {
    return this.generatePlaceholder(width, height);
  }

  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map((url) => this.cacheImage(url).catch(() => {}));
    await Promise.allSettled(promises);
  }

  getImageDimensions(
    url: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  getSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ');
  }

  async clear(): Promise<void> {
    this.memoryCache.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    this.memoryCache.clear();

    if (!this.db) return;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
    } catch {
      // silent fail
    }
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) return 0;

    let totalSize = 0;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.openCursor();

      await new Promise<void>((resolve) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            totalSize += cursor.value.size;
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

  async getImageCount(): Promise<number> {
    if (!this.db) return 0;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  destroy(): void {
    this.memoryCache.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    this.memoryCache.clear();
    this.loadingPromises.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const imageCache = new ImageCache();
export default imageCache;
