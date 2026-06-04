import { ComponentType, lazy } from 'react';
import { logMetric } from './performance.tsx';

type LazyComponent<T extends object> = React.LazyExoticComponent<ComponentType<T>>;

const preloadCache = new Map<string, Promise<any>>();

export function lazyLoadComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>
): LazyComponent<T> {
  const LazyComponent = lazy(importFn);

  const ComponentWithPreload = Object.assign(LazyComponent, {
    preload: () => {
      const key = importFn.toString();
      if (!preloadCache.has(key)) {
        preloadCache.set(key, importFn());
      }
      return preloadCache.get(key)!;
    },
  });

  return ComponentWithPreload;
}

export function preloadRoute(routePath: string): void {
  const routeImportMap: Record<string, () => Promise<any>> = {
    '/': () => import('../pages/HomePage'),
    '/menu': () => import('../pages/MenuPage'),
    '/order': () => import('../pages/OrderPage'),
    '/checkout': () => import('../pages/CheckoutPage'),
    '/reservation': () => import('../pages/ReservationPage'),
    '/about': () => import('../pages/AboutPage'),
    '/contact': () => import('../pages/ContactPage'),
    '/profile': () => import('../pages/ProfilePage'),
  };

  const importFn = routeImportMap[routePath];
  if (importFn) {
    const start = performance.now();
    importFn().then(() => {
      logMetric(`preload.${routePath}`, performance.now() - start);
    });
  }
}

export function preloadAllRoutes(): void {
  const routes = ['/', '/menu', '/reservation', '/about', '/contact'];
  routes.forEach((route) => preloadRoute(route));
}

export function preloadOnIdle(routePath: string): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(
      () => preloadRoute(routePath),
      { timeout: 3000 }
    );
  } else {
    setTimeout(() => preloadRoute(routePath), 200);
  }
}
