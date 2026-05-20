import api from '@/utils/axios';
import { Project, PaginatedResponse } from '@/types';

export const projectApi = {
  getAll: async (params = {}): Promise<PaginatedResponse<Project>> => {
    const { data } = await api.get('/projects', { params });
    return { data: data.data, meta: data.meta };
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/projects/${id}`);
    return data.data;
  },
  create: async (payload: object): Promise<Project> => {
    const { data } = await api.post('/projects', payload);
    return data.data;
  },
  update: async (id: string, payload: object): Promise<Project> => {
    const { data } = await api.put(`/projects/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
  getStats: async () => {
    const { data } = await api.get('/projects/stats');
    return data.data;
  },
};
