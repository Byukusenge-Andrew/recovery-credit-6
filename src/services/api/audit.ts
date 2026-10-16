import { apiClient } from './client';
import type { AuditLog } from '@/lib/types';

export interface AuditFilterParams {
  search?: string;
  action?: string;
  actor?: string;
}

export const auditApi = {
  list: async (params?: AuditFilterParams): Promise<AuditLog[]> => {
    const res = await apiClient.get<{ logs: AuditLog[] }>('/audit', {
      params: params as Record<string, string | number | boolean | undefined>
    });
    return res.logs || [];
  }
};
