import { apiClient } from './client';

export const profileApi = {
  update: async (data: {
    id?: string;
    username?: string;
    fullName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>('/profile', data);
  }
};
