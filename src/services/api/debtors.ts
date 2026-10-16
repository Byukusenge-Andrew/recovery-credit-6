import { apiClient } from './client';
import type { Debtor, Category, ColorFlag } from '@/lib/types';

export interface DebtorFilterParams {
  search?: string;
  category?: Category | string;
  flag?: ColorFlag | string;
  client?: string;
  role?: string;
  username?: string;
}

export const debtorsApi = {
  list: async (params?: DebtorFilterParams): Promise<Debtor[]> => {
    const res = await apiClient.get<{ debtors: Debtor[] }>('/debtors', {
      params: params as Record<string, string | number | boolean | undefined>
    });
    return res.debtors || [];
  },

  getById: async (id: string): Promise<Debtor> => {
    const res = await apiClient.get<{ debtor: Debtor }>(`/debtors/${encodeURIComponent(id)}`);
    return res.debtor;
  },

  create: async (data: Partial<Debtor>): Promise<{ success: boolean; id: string }> => {
    return apiClient.post<{ success: boolean; id: string }>('/debtors', data);
  },

  update: async (
    id: string,
    updates: Partial<Debtor> & { actorUsername?: string; actorFullName?: string; actorRole?: string }
  ): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(`/debtors/${encodeURIComponent(id)}`, updates);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/debtors/${encodeURIComponent(id)}`);
  },

  bulkUpload: async (payload: {
    debtors: any[];
    institutionId?: string;
    institutionName?: string;
    actorUsername?: string;
    actorFullName?: string;
  }): Promise<{ success: boolean; count: number }> => {
    return apiClient.post<{ success: boolean; count: number }>('/debtors/bulk', payload);
  }
};
