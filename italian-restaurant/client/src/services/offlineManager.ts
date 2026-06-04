import api from './api';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface OfflineManagerConfig {
  maxRetries: number;
  retryDelay: number;
  maxQueueSize: number;
}

const DEFAULT_CONFIG: OfflineManagerConfig = {
  maxRetries: 3,
  retryDelay: 5000,
  maxQueueSize: 50,
};

const DB_NAME = 'offline-manager';
const DB_VERSION = 1;
const STORE_NAME = 'requests';
const PENDING_ORDERS_STORE = 'pending-orders';

class OfflineManager {
  private isOnline: boolean;
  private queue: QueuedRequest[];
  private config: OfflineManagerConfig;
  private db: IDBDatabase | null;
  private listeners: Set<(online: boolean) => void>;
  private retryTimeouts: Map<string, ReturnType<typeof setTimeout>>;

  constructor(config: Partial<OfflineManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isOnline = navigator.onLine;
    this.queue = [];
    this.db = null;
    this.listeners = new Set();
    this.retryTimeouts = new Map();
    this.init();
  }

  private async init(): Promise<void> {
    await this.openDB();
    await this.loadQueue();
    this.setupListeners();

    if (this.isOnline && this.queue.length > 0) {
      this.processQueue();
    }
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
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(PENDING_ORDERS_STORE)) {
          db.createObjectStore(PENDING_ORDERS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  private setupListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }

  private async loadQueue(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        this.queue = request.result || [];
      };
    } catch {
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      this.queue.forEach((item) => store.put(item));
    } catch {
      // silent fail
    }
  }

  private generateId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async queueRequest<T>(
    method: string,
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    if (this.isOnline) {
      return this.executeRequest<T>(method, url, data, headers);
    }

    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Offline queue is full');
    }

    const queuedRequest: QueuedRequest = {
      id: this.generateId(),
      url,
      method: method.toUpperCase(),
      data,
      headers,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.config.maxRetries,
    };

    this.queue.push(queuedRequest);
    await this.saveQueue();

    return {
      queued: true,
      id: queuedRequest.id,
      message: 'Request queued for when you are back online',
    } as T;
  }

  private async executeRequest<T>(
    method: string,
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await api({
      method: method.toUpperCase(),
      url,
      data,
      headers,
    });
    return response.data as T;
  }

  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) return;

    const itemsToProcess = [...this.queue];
    this.queue = [];

    for (const item of itemsToProcess) {
      if (item.retries >= item.maxRetries) {
        continue;
      }

      try {
        await this.executeRequest(item.method, item.url, item.data, item.headers);
      } catch {
        item.retries++;
        if (item.retries < item.maxRetries) {
          this.queue.push(item);
        }
      }
    }

    await this.saveQueue();
  }

  retryFailedRequests(): void {
    if (this.isOnline && this.queue.length > 0) {
      this.processQueue();
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueuedRequests(): QueuedRequest[] {
    return [...this.queue];
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  async storePendingOrder(order: Record<string, unknown>): Promise<string> {
    const id = this.generateId();
    const orderWithId = { ...order, id, timestamp: Date.now() };

    if (!this.db) await this.openDB();
    if (!this.db) throw new Error('IndexedDB not available');

    try {
      const tx = this.db.transaction(PENDING_ORDERS_STORE, 'readwrite');
      const store = tx.objectStore(PENDING_ORDERS_STORE);
      store.put(orderWithId);
    } catch {
      // silent fail
    }

    return id;
  }

  async getPendingOrders(): Promise<Record<string, unknown>[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction(PENDING_ORDERS_STORE, 'readonly');
      const store = tx.objectStore(PENDING_ORDERS_STORE);
      const request = store.getAll();
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async removePendingOrder(id: string): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(PENDING_ORDERS_STORE, 'readwrite');
      const store = tx.objectStore(PENDING_ORDERS_STORE);
      store.delete(id);
    } catch {
      // silent fail
    }
  }

  destroy(): void {
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.listeners.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const offlineManager = new OfflineManager();
export default offlineManager;
