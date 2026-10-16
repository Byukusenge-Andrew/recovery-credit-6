import { apiClient } from './client';

export interface WhatsAppSendParams {
  debtorId: string;
  message: string;
  recipientPhone?: string;
  mode?: 'api' | 'web';
  collectorName?: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  mode: 'api' | 'web';
  messageId?: string;
  waLink?: string;
  formattedPhone?: string;
  activityId?: string;
  needsConfiguration?: boolean;
  error?: string;
}

export interface WhatsAppConfigData {
  metaAppId: string;
  metaAppSecretMasked: string;
  hasAppSecret: boolean;
  phoneNumberId: string;
  phoneNumberIdMasked: string;
  hasPhoneNumberId: boolean;
  hasAccessToken: boolean;
  businessAccountId: string;
  isCloudApiReady: boolean;
  isTokenValid?: boolean;
  metaAppStatus: {
    connected: boolean;
    appName?: string;
    category?: string;
    error?: string;
  };
  userTokenStatus: {
    valid: boolean;
    error?: string;
  } | null;
}

export const whatsappApi = {
  send: (params: WhatsAppSendParams) =>
    apiClient.post<WhatsAppSendResponse>('/whatsapp/send', params),

  getConfig: () =>
    apiClient.get<WhatsAppConfigData>('/whatsapp/config'),

  saveConfig: (data: {
    phoneNumberId?: string;
    accessToken?: string;
    businessAccountId?: string;
    metaAppId?: string;
    metaAppSecret?: string;
    testOnly?: boolean;
  }) =>
    apiClient.post<{ success: boolean; message: string; isCloudApiReady?: boolean }>('/whatsapp/config', data)
};
