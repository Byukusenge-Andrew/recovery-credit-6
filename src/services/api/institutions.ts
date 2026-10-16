import { apiClient } from './client';
import type { FinancialInstitution, Debtor } from '@/lib/types';

export interface InstitutionWithMetrics extends FinancialInstitution {
  metrics: {
    debtorsCount: number;
    totalOutstanding: number;
    totalPaid: number;
    totalBalance: number;
    recoveryRate: number;
  };
}

export interface InstitutionDetailResponse {
  institution: FinancialInstitution;
  debtors: Debtor[];
  metrics: {
    totalDebtors: number;
    totalOutstanding: number;
    totalPaid: number;
    totalBalance: number;
    recoveryRate: number;
    assignedCollectors: string[];
    categoryBreakdown: Record<string, number>;
    flagBreakdown: Record<string, number>;
  };
}

export interface InstitutionFilterParams {
  search?: string;
  category?: string;
  flag?: string;
  collector?: string;
  sortBy?: string;
}

export const institutionsApi = {
  list: async (): Promise<InstitutionWithMetrics[]> => {
    const res = await apiClient.get<{ institutions: InstitutionWithMetrics[] }>('/institutions');
    return res.institutions || [];
  },

  getById: async (id: string, params?: InstitutionFilterParams): Promise<InstitutionDetailResponse> => {
    return apiClient.get<InstitutionDetailResponse>(`/institutions/${encodeURIComponent(id)}`, {
      params: params as Record<string, string | number | boolean | undefined>
    });
  },

  create: async (data: {
    name: string;
    code?: string;
    institutionType?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    actorUsername?: string;
    actorFullName?: string;
  }): Promise<{ success: boolean; id: string }> => {
    return apiClient.post<{ success: boolean; id: string }>('/institutions', data);
  },

  update: async (
    id: string,
    updates: Partial<FinancialInstitution>
  ): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(`/institutions/${encodeURIComponent(id)}`, updates);
  }
};
