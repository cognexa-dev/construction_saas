import api from '@/utils/axios';

export type BudgetEstimateParams = {
  projectName: string;
  projectType: string;
  builtUpArea: number;
  floors: number;
  quality: 'economy' | 'standard' | 'premium';
  location: string;
  notes?: string;
};

export type BudgetEstimateResult = {
  constructionCost: number;
  mepCost: number;
  finishingCost: number;
  professionalFees: number;
  approvalCost: number;
  contingency: number;
  totalBudget: number;
  ratePerSqft: number;
  explanation: string;
  assumptions: string[];
  model: string;
};

export const aiApi = {
  estimateBudget: async (params: BudgetEstimateParams): Promise<BudgetEstimateResult> => {
    // AI calls can take 30–60s on free-tier models — use a dedicated longer timeout
    const { data } = await api.post('/ai/estimate-budget', params, { timeout: 90000 });
    return data.data;
  },
};
