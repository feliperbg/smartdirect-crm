import { create } from 'zustand';
import type { User, Tenant } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (data: { user: User; tenant: Tenant }) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: ({ user, tenant }) => {
    localStorage.setItem('crm_user', JSON.stringify(user));
    localStorage.setItem('crm_tenant', JSON.stringify(tenant));
    set({ user, tenant, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Erro ao efetuar logout no servidor', err);
    } finally {
      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_tenant');
      set({ user: null, tenant: null, isAuthenticated: false, isLoading: false });
    }
  },

  loadFromStorage: () => {
    const userStr = localStorage.getItem('crm_user');
    const tenantStr = localStorage.getItem('crm_tenant');

    if (userStr && tenantStr) {
      try {
        set({
          user: JSON.parse(userStr),
          tenant: JSON.parse(tenantStr),
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('crm_user');
        localStorage.removeItem('crm_tenant');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      localStorage.setItem('crm_tenant', JSON.stringify(data.tenant));
      set({
        user: data.user,
        tenant: data.tenant,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_tenant');
      set({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },
}));
