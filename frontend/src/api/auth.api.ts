import api from '@/utils/axios';
import { AuthUser } from '@/types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  refresh: async (refreshToken: string) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data.data;
  },

  me: async () => {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
};
