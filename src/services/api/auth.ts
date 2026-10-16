import { apiClient } from './client';
import type { User } from '@/lib/types';

export interface LoginResponse {
  success: boolean;
  token?: string;
  user: User;
}

export interface MeResponse {
  success: boolean;
  user: User;
}

export const authApi = {
  login: async (credentials: { usernameOrEmail: string; password: string }): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  me: async (): Promise<MeResponse> => {
    return apiClient.get<MeResponse>('/auth/me');
  },

  logout: async (): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>('/auth/logout');
  }
};
