import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://swyft-backend-five.vercel.app/api' : 'http://localhost:5000/api'),
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('otix_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/register');
      if (!isAuthPage) {
        console.warn('Session expired or unauthorized (401). Redirecting to login...');
        localStorage.removeItem('otix_token');
        localStorage.removeItem('otix_user');
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&session=expired`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
