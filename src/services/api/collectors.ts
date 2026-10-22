import { apiClient } from './client';
import type { User, CollectorPerformance, AgencyCollectorDashboardSummary, Debtor } from '@/lib/types';

export const collectorsApi = {
  list: async (): Promise<User[]> => {
    const res = await apiClient.get<{ users: User[] }>('/collectors');
    return (res.users || []).filter(u => u.role === 'collector');
  },

  getAllUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<{ users: User[] }>('/collectors');
    return res.users || [];
  },

  create: async (data: {
    username: string;
    fullName: string;
    email: string;
    password?: string;
  }): Promise<{ success: boolean; id: string; tempPassword?: string; emailSent?: boolean; emailError?: string }> => {
    return apiClient.post('/collectors', data);
  },

  getPerformanceMetrics: async (): Promise<{
    collectors: CollectorPerformance[];
    summary: AgencyCollectorDashboardSummary;
  }> => {
    return apiClient.get<{
      collectors: CollectorPerformance[];
      summary: AgencyCollectorDashboardSummary;
    }>('/collectors/metrics');
  },

  getUncontactedDebtors: async (collectorUsername: string): Promise<Debtor[]> => {
    const res = await apiClient.get<{ debtors: Debtor[] }>(
      `/collectors/uncontacted?collector=${encodeURIComponent(collectorUsername)}`
    );
    return res.debtors || [];
  }
};

