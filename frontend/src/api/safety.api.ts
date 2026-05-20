import api from '@/utils/axios';

export const safetyApi = {
  getDashboard: async (projectId?: string) => {
    const { data } = await api.get('/safety/dashboard', { params: { projectId } });
    return data.data;
  },
  getChecklists: async () => {
    const { data } = await api.get('/safety/checklists');
    return data.data;
  },
  createChecklist: async (payload: object) => {
    const { data } = await api.post('/safety/checklists', payload);
    return data.data;
  },
  submitChecklist: async (payload: object) => {
    const { data } = await api.post('/safety/checklists/submit', payload);
    return data.data;
  },
  getSubmissions: async (params: object) => {
    const { data } = await api.get('/safety/checklists/submissions', { params });
    return data.data;
  },
  getIncidents: async (params = {}) => {
    const { data } = await api.get('/safety/incidents', { params });
    return data.data;
  },
  createIncident: async (payload: object) => {
    const { data } = await api.post('/safety/incidents', payload);
    return data.data;
  },
  updateIncident: async (id: string, payload: object) => {
    const { data } = await api.put(`/safety/incidents/${id}`, payload);
    return data.data;
  },
  getInsurances: async (params = {}) => {
    const { data } = await api.get('/safety/insurance', { params });
    return data.data;
  },
  addInsurance: async (payload: object) => {
    const { data } = await api.post('/safety/insurance', payload);
    return data.data;
  },
  getExpiringInsurances: async (days = 30) => {
    const { data } = await api.get('/safety/insurance/expiring', { params: { days } });
    return data.data;
  },
};
