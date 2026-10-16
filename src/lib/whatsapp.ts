import { sql } from './db';

export interface WhatsAppConfig {
  metaAppId: string;
  metaAppSecret: string;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  isCloudApiReady: boolean;
}

/**
 * Normalizes phone numbers to standard international formats (Rwanda +250, South Africa +27, etc.)
 */
export function formatWhatsAppPhone(raw: string): { e164: string; cleanDigits: string; display: string } {
  if (!raw) return { e164: '', cleanDigits: '', display: '' };

  let digits = raw.replace(/[^0-9+]/g, '');

  if (digits.startsWith('+')) {
    const cleanDigits = digits.replace('+', '');
    return { e164: digits, cleanDigits, display: digits };
  }

  // Handle local numbers starting with 0
  if (digits.startsWith('0')) {
    // 078, 079, 072, 073 are standard Rwanda mobile prefixes (10 digits)
    if (digits.length === 10 && digits.startsWith('07')) {
      const cleanDigits = '250' + digits.slice(1);
      return { e164: '+' + cleanDigits, cleanDigits, display: '+' + cleanDigits };
    }
    // South Africa prefixes (082, 083, 071, 072, 060, etc.)
    if (digits.length === 10 && (digits.startsWith('08') || digits.startsWith('06') || digits.startsWith('07'))) {
      const cleanDigits = '27' + digits.slice(1);
      return { e164: '+' + cleanDigits, cleanDigits, display: '+' + cleanDigits };
    }
    // Default fallback to Rwanda +250
    const cleanDigits = '250' + digits.slice(1);
    return { e164: '+' + cleanDigits, cleanDigits, display: '+' + cleanDigits };
  }

  // If already starts with country code without +
  if (digits.startsWith('250') || digits.startsWith('27') || digits.startsWith('254') || digits.startsWith('256')) {
    return { e164: '+' + digits, cleanDigits: digits, display: '+' + digits };
  }

  // Default to appending +
  return { e164: '+' + digits, cleanDigits: digits, display: '+' + digits };
}

/**
 * Loads WhatsApp & Meta settings from system_settings table, falling back to process.env
 */
export async function getWhatsAppSettings(): Promise<WhatsAppConfig> {
  let metaAppId = process.env.META_APP_ID || '27887479994259125';
  let metaAppSecret = process.env.META_APP_SECRET || 'ce81b8b910b12ee80ccbe7f8b9773953';
  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  let businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';

  try {
    const rows = await sql`
      SELECT key, value FROM system_settings 
      WHERE key IN (
        'meta_app_id', 
        'meta_app_secret', 
        'whatsapp_phone_number_id', 
        'whatsapp_access_token', 
        'whatsapp_business_account_id'
      )
    `;

    for (const r of rows) {
      if (r.key === 'meta_app_id' && r.value) metaAppId = r.value;
      if (r.key === 'meta_app_secret' && r.value) metaAppSecret = r.value;
      if (r.key === 'whatsapp_phone_number_id' && r.value) phoneNumberId = r.value;
      if (r.key === 'whatsapp_access_token' && r.value) accessToken = r.value;
      if (r.key === 'whatsapp_business_account_id' && r.value) businessAccountId = r.value;
    }
  } catch (err) {
    console.warn('Could not read system_settings for WhatsApp, using environment fallback:', err);
  }

  const isCloudApiReady = Boolean(phoneNumberId.trim() && accessToken.trim());

  return {
    metaAppId: metaAppId.trim(),
    metaAppSecret: metaAppSecret.trim(),
    phoneNumberId: phoneNumberId.trim(),
    accessToken: accessToken.trim(),
    businessAccountId: businessAccountId.trim(),
    isCloudApiReady
  };
}

/**
 * Dispatches a message via Meta WhatsApp Business Cloud API (Graph API v21.0)
 */
export async function sendWhatsAppCloudMessage(params: {
  to: string;
  text?: string;
  templateName?: string;
  languageCode?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: any;
}> {
  const config = await getWhatsAppSettings();

  if (!config.isCloudApiReady) {
    return {
      success: false,
      error: 'WhatsApp Cloud API is not fully configured. Please provide Phone Number ID and Access Token in WhatsApp Settings.'
    };
  }

  const { cleanDigits } = formatWhatsAppPhone(params.to);
  if (!cleanDigits) {
    return { success: false, error: 'Recipient phone number is invalid or missing.' };
  }

  const url = `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;

  let payload: any;
  if (params.templateName) {
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanDigits,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.languageCode || 'en_US' }
      }
    };
  } else {
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanDigits,
      type: 'text',
      text: {
        preview_url: false,
        body: params.text || ''
      }
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      const errCode = data?.error?.code;
      const rawMsg =
        data?.error?.message ||
        data?.error?.error_user_msg ||
        data?.error?.error_data?.details ||
        `Meta API error (${response.status})`;

      let friendlyError = rawMsg;
      if (errCode === 131030 || String(rawMsg).toLowerCase().includes('allowed list')) {
        friendlyError = `Meta Sandbox Restriction: Recipient number (${params.to}) is not in your allowed test recipient list. In development mode with Meta's test number (+1 555-670-2643), add the recipient in Meta Developers Console > WhatsApp > API Setup, or click "Open in WhatsApp Web" below to send without restriction.`;
      } else if (errCode === 131047 || String(rawMsg).toLowerCase().includes('24 hour')) {
        friendlyError = `Meta 24-Hour Policy Window: Freeform messages require the debtor to have messaged this business number in the past 24 hours. Click "Open in WhatsApp Web" below to send immediately.`;
      } else if (errCode === 190) {
        friendlyError = `Meta Access Token Expired or Invalid: Please generate a new WhatsApp Access Token in Meta Developer Console and update WhatsApp Settings.`;
      }

      return {
        success: false,
        error: friendlyError,
        rawResponse: data
      };
    }

    const messageId = data?.messages?.[0]?.id || 'msg_' + Date.now();
    return {
      success: true,
      messageId,
      rawResponse: data
    };
  } catch (netErr: any) {
    return {
      success: false,
      error: netErr.message || 'Network error communicating with Meta Graph API.'
    };
  }
}

/**
 * Generates 1-click wa.me fallback link
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const { cleanDigits } = formatWhatsAppPhone(phone);
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(text)}`;
}

/**
 * Standard collection reminder templates
 */
export interface DebtorReminderContext {
  debtorName: string;
  clientName: string;
  accountNumber: string;
  outstandingBalance: number;
  assignedCollector?: string;
}

export function getWhatsAppTemplates(context: DebtorReminderContext) {
  const balanceStr = 'R ' + Number(context.outstandingBalance || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const collector = context.assignedCollector || 'your recovery officer';

  return [
    {
      id: 'standard_reminder',
      name: 'Standard Balance Reminder',
      category: 'Friendly',
      text: `Dear ${context.debtorName}, this is an official reminder from Recovery Credit regarding your ${context.clientName} account (${context.accountNumber}). The remaining balance due is ${balanceStr}. Please contact ${collector} to arrange settlement or schedule a payment meeting. Thank you.`
    },
    {
      id: 'urgent_notice',
      name: 'Urgent Overdue Notice',
      category: 'Urgent',
      text: `URGENT NOTICE: Dear ${context.debtorName}, your account (${context.accountNumber}) with ${context.clientName} has an overdue outstanding balance of ${balanceStr}. Immediate contact with Recovery Credit (${collector}) is required today to avoid formal credit escalation.`
    },
    {
      id: 'settlement_offer',
      name: 'Payment Plan / Settlement Offer',
      category: 'Negotiation',
      text: `Dear ${context.debtorName}, Recovery Credit is open to structured settlement discussions for your ${context.clientName} balance (${balanceStr}, Acc: ${context.accountNumber}). Please reply to this message or contact ${collector} to arrange an affordable installment plan.`
    },
    {
      id: 'promise_followup',
      name: 'Promise-to-Pay Confirmation',
      category: 'Commitment',
      text: `Dear ${context.debtorName}, this message confirms your payment commitment regarding account ${context.accountNumber} with ${context.clientName}. Total remaining balance is ${balanceStr}. Please ensure payment proof is submitted upon deposit.`
    }
  ];
}
