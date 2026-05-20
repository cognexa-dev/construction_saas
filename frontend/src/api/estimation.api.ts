import api from '@/utils/axios';

export const estimationApi = {
  getByProject: async (projectId: string) => {
    const { data } = await api.get(`/estimations/${projectId}`);
    return data.data;
  },
  updateSettings: async (projectId: string, payload: {
    contingencyPct?: number;
    profitPct?: number;
    gstPct?: number;
    notes?: string;
  }) => {
    const { data } = await api.patch(`/estimations/${projectId}/settings`, payload);
    return data.data;
  },
  addItem: async (projectId: string, payload: object) => {
    const { data } = await api.post(`/estimations/${projectId}/items`, payload);
    return data.data;
  },
  updateItem: async (id: string, payload: object) => {
    const { data } = await api.patch(`/estimations/items/${id}`, payload);
    return data.data;
  },
  deleteItem: async (id: string) => {
    await api.delete(`/estimations/items/${id}`);
  },
};
