import api from '@/utils/axios';

export const financialsApi = {
  getDashboard: async (projectId?: string) => {
    const { data } = await api.get('/financials/dashboard', { params: { projectId } });
    return data.data;
  },
  getRevenueSummary: async (projectId?: string) => {
    const { data } = await api.get('/financials/revenue/summary', { params: { projectId } });
    return data.data;
  },
  getRevenueEntries: async (params = {}) => {
    const { data } = await api.get('/financials/revenue', { params });
    return data.data;
  },
  createRevenueEntry: async (payload: object) => {
    const { data } = await api.post('/financials/revenue', payload);
    return data.data;
  },
  updateRevenueEntry: async (id: string, payload: object) => {
    const { data } = await api.put(`/financials/revenue/${id}`, payload);
    return data.data;
  },
  deleteRevenueEntry: async (id: string) => {
    await api.delete(`/financials/revenue/${id}`);
  },
  getMarginAnalysis: async (projectId?: string) => {
    const { data } = await api.get('/financials/margin', { params: { projectId } });
    return data.data;
  },
  exportTally: async (payload: object) => {
    const response = await api.post('/financials/tally/export', payload, { responseType: 'blob' });
    return response;
  },
  getExportLogs: async () => {
    const { data } = await api.get('/financials/tally/logs');
    return data.data;
  },
};
