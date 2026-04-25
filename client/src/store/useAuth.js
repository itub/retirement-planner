import { create } from 'zustand';
import { authApi } from '../lib/api';

export const useAuth = create((set) => ({
  user: null,
  loading: true,
  fetchUser: async () => {
    try {
      const { data } = await authApi.get('/me');
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    await authApi.post('/logout');
    set({ user: null });
  },
}));
