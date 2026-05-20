import api from '@/utils/axios';

export const budgetApi = {
  getByProject: async (projectId: string) => {
    const { data } = await api.get(`/budget/project/${projectId}`);
    return data.data;
  },
  getVarianceReport: async (projectId: string) => {
    const { data } = await api.get(`/budget/project/${projectId}/variance`);
    return data.data;
  },
  createItem: async (payload: object) => {
    const { data } = await api.post('/budget', payload);
    return data.data;
  },
  updateItem: async (id: string, payload: object) => {
    const { data } = await api.put(`/budget/${id}`, payload);
    return data.data;
  },
  deleteItem: async (id: string) => {
    await api.delete(`/budget/${id}`);
  },
  getCostEntries: async (itemId: string) => {
    const { data } = await api.get(`/budget/${itemId}/cost-entries`);
    return data.data;
  },
  addCostEntry: async (payload: object) => {
    const { data } = await api.post('/budget/cost-entries', payload);
    return data.data;
  },
  deleteCostEntry: async (id: string) => {
    await api.delete(`/budget/cost-entries/${id}`);
  },
};
