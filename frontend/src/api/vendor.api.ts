import api from '@/utils/axios';
import { Vendor, PaginatedResponse } from '@/types';

export const vendorApi = {
  getAll: async (params = {}): Promise<PaginatedResponse<Vendor>> => {
    const { data } = await api.get('/vendors', { params });
    return { data: data.data, meta: data.meta };
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/vendors/${id}`);
    return data.data;
  },
  create: async (payload: object) => {
    const { data } = await api.post('/vendors', payload);
    return data.data;
  },
  update: async (id: string, payload: object) => {
    const { data } = await api.put(`/vendors/${id}`, payload);
    return data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/vendors/${id}`);
  },
  addRating: async (id: string, payload: object) => {
    const { data } = await api.post(`/vendors/${id}/ratings`, payload);
    return data.data;
  },
  getTopVendors: async (category?: string) => {
    const { data } = await api.get('/vendors/top', { params: { category } });
    return data.data;
  },
};
