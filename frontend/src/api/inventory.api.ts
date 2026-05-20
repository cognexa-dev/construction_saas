import api from '@/utils/axios';
import { InventoryItem, PaginatedResponse } from '@/types';

export const inventoryApi = {
  getAll: async (params = {}): Promise<PaginatedResponse<InventoryItem>> => {
    const { data } = await api.get('/inventory', { params });
    return { data: data.data, meta: data.meta };
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/inventory/${id}`);
    return data.data;
  },
  create: async (payload: object) => {
    const { data } = await api.post('/inventory', payload);
    return data.data;
  },
  update: async (id: string, payload: object) => {
    const { data } = await api.put(`/inventory/${id}`, payload);
    return data.data;
  },
  recordTransaction: async (payload: object) => {
    const { data } = await api.post('/inventory/transactions', payload);
    return data.data;
  },
  getTransactionHistory: async (id: string) => {
    const { data } = await api.get(`/inventory/${id}/transactions`);
    return data.data;
  },
  getLowStockAlerts: async () => {
    const { data } = await api.get('/inventory/alerts/low-stock');
    return data.data;
  },
  createPR: async (payload: object) => {
    const { data } = await api.post('/inventory/pr', payload);
    return data.data;
  },
  getPRsByProject: async (projectId: string) => {
    const { data } = await api.get(`/inventory/pr/project/${projectId}`);
    return data.data;
  },
  getPRById: async (id: string) => {
    const { data } = await api.get(`/inventory/pr/${id}`);
    return data.data;
  },
  updatePRStatus: async (id: string, payload: object) => {
    const { data } = await api.patch(`/inventory/pr/${id}/status`, payload);
    return data.data;
  },
};
