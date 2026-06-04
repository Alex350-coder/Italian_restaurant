import { ComponentType, useEffect, useRef } from 'react';

export function measureRender(componentName: string) {
  return function <P extends object>(WrappedComponent: ComponentType<P>) {
    function MeasuredComponent(props: P) {
      const renderStart = useRef(performance.now());

      useEffect(() => {
        const renderEnd = performance.now();
        const renderTime = renderEnd - renderStart.current;

        if (import.meta.env.DEV) {
          console.log(`⏱️ ${componentName} render time: ${renderTime.toFixed(2)}ms`);
        }
      });

      renderStart.current = performance.now();
      return <WrappedComponent {...props} />;
    }

    MeasuredComponent.displayName = `Measured(${componentName})`;
    return MeasuredComponent;
  };
}

const metricsBuffer: { name: string; value: number; timestamp: number }[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

export function logMetric(name: string, value: number): void {
  metricsBuffer.push({
    name,
    value,
    timestamp: Date.now(),
  });

  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushMetrics();
      flushTimeout = null;
    }, 5000);
  }
}

function flushMetrics(): void {
  if (metricsBuffer.length === 0) return;

  if (import.meta.env.DEV) {
    console.group('📊 Performance Metrics');
    metricsBuffer.forEach((m) => {
      console.log(`${m.name}: ${m.value.toFixed(2)}ms`);
    });
    console.groupEnd();
  }

  metricsBuffer.length = 0;
}

export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    logMetric(name, duration);
  });
}

export function observeLongTasks(): void {
  if (typeof window === 'undefined') return;

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'longtask') {
            logMetric('longtask', entry.duration);
          }
        });
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // Long task observer not supported
    }
  }
}
