import { apiClient } from './client';
import type { Payment } from '@/lib/types';

export const paymentsApi = {
  getByDebtorId: async (debtorId: string): Promise<Payment[]> => {
    const res = await apiClient.get<{ payments: Payment[] }>(`/debtors/${encodeURIComponent(debtorId)}/payments`);
    return res.payments || [];
  },

  create: async (
    debtorId: string,
    data: {
      amountPaid: number;
      paymentDate: string;
      recordedBy: string;
      role?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; id: string }> => {
    return apiClient.post<{ success: boolean; id: string }>(
      `/debtors/${encodeURIComponent(debtorId)}/payments`,
      data
    );
  },

  update: async (
    paymentId: string,
    updates: {
      amountPaid: number;
      paymentDate: string;
      notes?: string;
      adminUsername: string;
    }
  ): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(`/payments/${encodeURIComponent(paymentId)}`, updates);
  },

  delete: async (paymentId: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/payments/${encodeURIComponent(paymentId)}`);
  }
};
