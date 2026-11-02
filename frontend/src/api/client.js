import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('checkwave_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally - redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // Only redirect if not already on /login or /register
    if (error.response?.status === 401) {
      localStorage.removeItem('checkwave_token');
      localStorage.removeItem('checkwave_user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API methods
export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export const monitorsApi = {
  list: (params) => apiClient.get('/monitors', { params }),
  get: (id) => apiClient.get(`/monitors/${id}`),
  create: (data) => apiClient.post('/monitors', data),
  update: (id, data) => apiClient.put(`/monitors/${id}`, data),
  delete: (id) => apiClient.delete(`/monitors/${id}`),
  pause: (id) => apiClient.post(`/monitors/${id}/pause`),
  resume: (id) => apiClient.post(`/monitors/${id}/resume`),
  check: (id) => apiClient.post(`/monitors/${id}/check`),
  history: (id, params) => apiClient.get(`/monitors/${id}/history`, { params }),
};

export const metricsApi = {
  analytics: (params) => apiClient.get('/metrics/analytics', { params }),
  slowest: (params) => apiClient.get('/metrics/slowest', { params }),
};

export const incidentsApi = {
  list: (params) => apiClient.get('/incidents', { params }),
  get: (id) => apiClient.get(`/incidents/${id}`),
  resolve: (id) => apiClient.put(`/incidents/${id}/resolve`),
};

export const dashboardApi = {
  summary: (params) => apiClient.get('/dashboard/summary', { params }),
};
