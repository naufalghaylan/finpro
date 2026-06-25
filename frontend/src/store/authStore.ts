import { create } from 'zustand';
import api from '../api/axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  emailVerified?: boolean;
  storeId?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { emailOrUsername: string; password: string; rememberMe?: boolean }) => Promise<void>;
  socialLogin: (payload: { token: string, provider: 'GOOGLE' }) => Promise<{ isNewUser: boolean }>;
  register: (userData: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true by default to handle initial check

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    await api.post('/auth/register', userData);
    // Do not set user as they need to verify their email first
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  socialLogin: async (payload: { token: string, provider: 'GOOGLE' }) => {
    try {
      const response = await api.post('/auth/social-login', payload);
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      return { isNewUser: response.data.isNewUser as boolean };
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
