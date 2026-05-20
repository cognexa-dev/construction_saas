import api from '@/utils/axios';
import { User, CreateUserFormData, UpdateUserFormData, PaginatedResponse } from '@/types';

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export const userApi = {
  getAll: async (params: UserQuery = {}): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/users', { params });
    return { data: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`);
    return data.data;
  },

  create: async (payload: CreateUserFormData): Promise<User> => {
    const { data } = await api.post('/users', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateUserFormData): Promise<User> => {
    const { data } = await api.put(`/users/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  toggleStatus: async (id: string): Promise<{ id: string; status: string }> => {
    const { data } = await api.patch(`/users/${id}/toggle-status`);
    return data.data;
  },
};
