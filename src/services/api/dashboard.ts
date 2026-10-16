import { apiClient } from './client';
import type { DashboardStats } from '@/lib/store';

export const dashboardApi = {
  getStats: async (params?: { role?: string; username?: string }): Promise<DashboardStats> => {
    const res = await apiClient.get<{ stats: DashboardStats }>('/dashboard/stats', {
      params: params as Record<string, string | number | boolean | undefined>
    });
    return res.stats;
  }
};
