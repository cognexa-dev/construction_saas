import api from '@/utils/axios';

export const boqApi = {
  getByProject: async (projectId: string) => {
    const { data } = await api.get(`/boq/${projectId}`);
    return data.data;
  },
  create: async (projectId: string, payload: object) => {
    const { data } = await api.post(`/boq/${projectId}`, payload);
    return data.data;
  },
  update: async (id: string, payload: object) => {
    const { data } = await api.put(`/boq/${id}`, payload);
    return data.data; // { item, warnings }
  },
  delete: async (id: string) => {
    await api.delete(`/boq/${id}`);
  },

  // Material links
  getMaterials: async (boqItemId: string) => {
    const { data } = await api.get(`/boq/items/${boqItemId}/materials`);
    return data.data;
  },
  addMaterial: async (boqItemId: string, inventoryItemId: string, consumptionRate: number) => {
    const { data } = await api.post(`/boq/items/${boqItemId}/materials`, { inventoryItemId, consumptionRate });
    return data.data;
  },
  updateMaterial: async (linkId: string, consumptionRate: number) => {
    const { data } = await api.patch(`/boq/materials/${linkId}`, { consumptionRate });
    return data.data;
  },
  removeMaterial: async (linkId: string) => {
    await api.delete(`/boq/materials/${linkId}`);
  },
};
