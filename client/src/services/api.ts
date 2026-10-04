import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('petronexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauthenticated 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/app')) {
      localStorage.removeItem('petronexus_token');
      localStorage.removeItem('petronexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
