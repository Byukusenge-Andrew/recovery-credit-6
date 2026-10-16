import { apiClient } from './client';
import type { Activity, ActivityType, EnrichedActivity, ActivitySummary } from '@/lib/types';

export const activitiesApi = {
  getByDebtorId: async (debtorId: string, params?: { date?: string; type?: string }): Promise<Activity[]> => {
    const q = new URLSearchParams();
    if (params?.date) q.set('date', params.date);
    if (params?.type && params.type !== 'all') q.set('type', params.type);
    const queryStr = q.toString() ? `?${q.toString()}` : '';

    const res = await apiClient.get<{ activities: Activity[] }>(`/debtors/${encodeURIComponent(debtorId)}/activities${queryStr}`);
    return res.activities || [];
  },

  create: async (
    debtorId: string,
    data: {
      activityType: ActivityType;
      description: string;
      scheduledDate?: string;
      createdBy: string;
    }
  ): Promise<{ success: boolean; id: string }> => {
    return apiClient.post<{ success: boolean; id: string }>(
      `/debtors/${encodeURIComponent(debtorId)}/activities`,
      data
    );
  },

  getCollectorActivities: async (params?: {
    collector?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    activityType?: string;
    search?: string;
  }): Promise<{ activities: EnrichedActivity[]; summary: ActivitySummary }> => {
    const q = new URLSearchParams();
    if (params?.collector) q.set('collector', params.collector);
    if (params?.date) q.set('date', params.date);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.activityType) q.set('activityType', params.activityType);
    if (params?.search) q.set('search', params.search);
    const queryStr = q.toString() ? `?${q.toString()}` : '';

    return apiClient.get<{ activities: EnrichedActivity[]; summary: ActivitySummary }>(
      `/collectors/activities${queryStr}`
    );
  }
};

