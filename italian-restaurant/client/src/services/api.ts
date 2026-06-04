import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const mutatingMethods = ['post', 'put', 'patch', 'delete'];

let csrfToken: string | null = null;

async function fetchCsrfToken() {
  try {
    const res = await api.get('/csrf-token');
    csrfToken = res.data?.data?.csrfToken || null;
  } catch {
    csrfToken = null;
  }
}

function isExempt(url: string): boolean {
  return url === '/auth/login' || url === '/auth/register';
}

fetchCsrfToken();

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const method = config.method?.toLowerCase();
    if (method && mutatingMethods.includes(method) && !isExempt(config.url || '')) {
      if (!token || !csrfToken) {
        await fetchCsrfToken();
      }
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const config = error.config;

      if (status === 401) {
        localStorage.removeItem('auth_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      if (status === 403 && data?.error?.includes('CSRF') && !config._csrfRetry) {
        config._csrfRetry = true;
        csrfToken = null;
        await fetchCsrfToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
          return api(config);
        }
      }

      if (status === 500) {
        console.error('Server error');
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    } else {
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
