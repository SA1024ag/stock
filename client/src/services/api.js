import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests dynamically using interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors (expired Upstox token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's a 401 error from Upstox-related endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || '';

      // If it's an Upstox-related endpoint, emit a custom event
      if (url.includes('/stocks') || url.includes('/market') || url.includes('/upstox')) {
        console.warn('⚠️ Upstox API returned 401 - Token may be expired');

        // Emit custom event that the hook can listen to
        window.dispatchEvent(new CustomEvent('upstox-token-expired', {
          detail: { error: error.response }
        }));
      }
    }

    return Promise.reject(error);
  }
);

export default api;

