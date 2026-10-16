import { apiClient } from './client';
import type { Notification } from '@/lib/types';

export const notificationsApi = {
  list: async (username: string): Promise<Notification[]> => {
    const res = await apiClient.get<{ notifications: Notification[] }>('/notifications', {
      params: { username }
    });
    return res.notifications || [];
  },

  markRead: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>('/notifications', { id });
  },

  markAllRead: async (username: string): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>('/notifications', { username, markAll: true });
  }
};
