import api from '@/utils/axios';

export const complianceApi = {
  getSummary: async () => {
    const { data } = await api.get('/compliance/summary');
    return data.data;
  },
  getRera: async (projectId: string) => {
    const { data } = await api.get(`/compliance/rera/${projectId}`);
    return data.data;
  },
  upsertRera: async (projectId: string, payload: object) => {
    const { data } = await api.put(`/compliance/rera/${projectId}`, payload);
    return data.data;
  },
  addMilestone: async (projectId: string, payload: object) => {
    const { data } = await api.post(`/compliance/rera/${projectId}/milestones`, payload);
    return data.data;
  },
  updateMilestone: async (id: string, payload: object) => {
    const { data } = await api.patch(`/compliance/milestones/${id}`, payload);
    return data.data;
  },
  getLand: async (projectId: string) => {
    const { data } = await api.get(`/compliance/land/${projectId}`);
    return data.data;
  },
  upsertLand: async (projectId: string, payload: object) => {
    const { data } = await api.put(`/compliance/land/${projectId}`, payload);
    return data.data;
  },
  upsertApproval: async (projectId: string, payload: object) => {
    const { data } = await api.put(`/compliance/land/${projectId}/approval`, payload);
    return data.data;
  },
};
