import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratar erros de autenticação (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpa dados de sessão salvos no localStorage
      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
