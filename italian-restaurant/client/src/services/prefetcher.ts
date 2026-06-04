type Priority = 'high' | 'medium' | 'low';

interface PrefetchJob {
  id: string;
  url: string;
  priority: Priority;
  controller: AbortController;
  timestamp: number;
}

interface PrefetchConfig {
  maxConcurrent: number;
  maxIdleConcurrent: number;
  idleTimeout: number;
  priorityThresholds: Record<Priority, number>;
}

const DEFAULT_CONFIG: PrefetchConfig = {
  maxConcurrent: 6,
  maxIdleConcurrent: 3,
  idleTimeout: 2000,
  priorityThresholds: {
    high: 6,
    medium: 3,
    low: 1,
  },
};

class Prefetcher {
  private activeJobs: Map<string, PrefetchJob>;
  private queue: PrefetchJob[];
  private config: PrefetchConfig;
  private idleCallback: number | null;
  private intersectionObserver: IntersectionObserver | null;
  private abortControllers: Map<string, AbortController>;

  constructor(config: Partial<PrefetchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.activeJobs = new Map();
    this.queue = [];
    this.idleCallback = null;
    this.intersectionObserver = null;
    this.abortControllers = new Map();
    this.initIntersectionObserver();
  }

  private initIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const url = entry.target.getAttribute('data-prefetch-url');
            if (url) {
              this.prefetch(url, 'medium');
            }
            this.intersectionObserver?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );
  }

  private generateId(url: string): string {
    return `prefetch-${url}-${Date.now()}`;
  }

  private canStartJob(priority: Priority): boolean {
    const limit = this.config.priorityThresholds[priority];
    const activeForPriority = Array.from(this.activeJobs.values()).filter(
      (job) => job.priority === priority
    ).length;
    return activeForPriority < limit;
  }

  private async executePrefetch(job: PrefetchJob): Promise<void> {
    this.activeJobs.set(job.id, job);

    try {
      const response = await fetch(job.url, {
        signal: job.controller.signal,
        headers: { 'Purpose': 'prefetch' },
      });

      if (response.ok) {
        await response.blob();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // cancelled
      }
    } finally {
      this.activeJobs.delete(job.id);
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;

    const sortedQueue = [...this.queue].sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const job of sortedQueue) {
      if (this.canStartJob(job.priority)) {
        this.queue = this.queue.filter((j) => j.id !== job.id);
        this.executePrefetch(job);
      }
    }
  }

  prefetch(url: string, priority: Priority = 'medium'): void {
    if (this.abortControllers.has(url)) return;

    const existingJob = this.activeJobs.get(url);
    if (existingJob) return;

    const controller = new AbortController();
    this.abortControllers.set(url, controller);

    const job: PrefetchJob = {
      id: this.generateId(url),
      url,
      priority,
      controller,
      timestamp: Date.now(),
    };

    if (this.canStartJob(priority)) {
      this.executePrefetch(job);
    } else {
      this.queue.push(job);
    }
  }

  prefetchMultiple(urls: string[], priority: Priority = 'low'): void {
    urls.forEach((url) => this.prefetch(url, priority));
  }

  cancelPrefetch(url: string): void {
    const controller = this.abortControllers.get(url);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(url);
    }

    this.queue = this.queue.filter((job) => job.url !== url);
  }

  cancelAll(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
    this.activeJobs.clear();
    this.queue = [];

    if (this.idleCallback !== null) {
      cancelIdleCallback(this.idleCallback);
      this.idleCallback = null;
    }
  }

  observeElement(element: HTMLElement, url: string): void {
    if (!this.intersectionObserver) return;
    element.setAttribute('data-prefetch-url', url);
    this.intersectionObserver.observe(element);
  }

  unobserveElement(element: HTMLElement): void {
    if (!this.intersectionObserver) return;
    this.intersectionObserver.unobserve(element);
    element.removeAttribute('data-prefetch-url');
  }

  prefetchOnIdle(urls: string[]): void {
    if (typeof requestIdleCallback === 'undefined') {
      urls.forEach((url) => this.prefetch(url, 'low'));
      return;
    }

    this.idleCallback = requestIdleCallback(
      (deadline) => {
        let i = 0;
        while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && i < urls.length) {
          this.prefetch(urls[i], 'low');
          i++;
        }
        this.idleCallback = null;
      },
      { timeout: this.config.idleTimeout }
    );
  }

  prefetchRelatedDish(_currentDishId: string, relatedIds: string[]): void {
    const apiBase = '/api/menu';
    const urls = relatedIds.map((id) => `${apiBase}/${id}`);
    this.prefetchMultiple(urls, 'low');
  }

  prefetchNextPage(currentPage: number, basePath: string): void {
    const url = `${basePath}?page=${currentPage + 1}`;
    this.prefetch(url, 'low');
  }

  getActiveCount(): number {
    return this.activeJobs.size;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  destroy(): void {
    this.cancelAll();
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
}

export const prefetcher = new Prefetcher();
export default prefetcher;
