import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CacheProvider } from './context/CacheContext';
import { offlineManager } from './services/offlineManager';
import { prefetcher } from './services/prefetcher';
import { cacheService } from './services/cacheService';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch {
      // Service worker registration failed
    }
  });
}

window.addEventListener('online', () => {
  offlineManager.retryFailedRequests();
  document.documentElement.classList.remove('offline');
  document.documentElement.classList.add('online');
});

window.addEventListener('offline', () => {
  document.documentElement.classList.remove('online');
  document.documentElement.classList.add('offline');
});

if (navigator.onLine) {
  document.documentElement.classList.add('online');
} else {
  document.documentElement.classList.add('offline');
}

window.addEventListener('load', async () => {
  try {
    await cacheService.warmCache([
      {
        key: 'menu-categories',
        fetcher: async () => {
          const res = await fetch('/api/menu/categories');
          return res.json();
        },
        ttl: 30 * 60 * 1000,
      },
      {
        key: 'restaurant-info',
        fetcher: async () => {
          const res = await fetch('/api/info');
          return res.json();
        },
        ttl: 60 * 60 * 1000,
      },
    ]);
  } catch {
    // Cache warming failed, will retry on next visit
  }
});

window.addEventListener('load', () => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      prefetcher.prefetchMultiple(['/api/menu', '/api/menu/categories'], 'low');
    });
  }
});

window.addEventListener('beforeunload', () => {
  prefetcher.destroy();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    prefetcher.cancelAll();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CacheProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </CacheProvider>
    </BrowserRouter>
  </React.StrictMode>
);
