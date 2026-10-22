import nodemailer from 'nodemailer';
import { sql } from './db';

export interface EmailSettings {
  gmailUser?: string;
  gmailPass?: string;
  resendApiKey?: string;
  fromEmail: string;
  isReady: boolean;
}

export async function getEmailSettings(): Promise<EmailSettings> {
  let gmailUser = process.env.GMAIL_USER || '';
  let gmailPass = process.env.GMAIL_APP_PASSWORD || '';
  let resendApiKey = process.env.RESEND_API_KEY || '';
  let fromEmail = process.env.RESEND_FROM_EMAIL || 'Recovery Credit <onboarding@resend.dev>';

  try {
    const rows = await sql`
      SELECT key, value FROM system_settings 
      WHERE key IN ('gmail_user', 'gmail_app_password', 'resend_api_key', 'resend_from_email')
    `;
    for (const r of rows) {
      if (r.key === 'gmail_user' && r.value) gmailUser = r.value;
      if (r.key === 'gmail_app_password' && r.value) gmailPass = r.value;
      if (r.key === 'resend_api_key' && r.value) resendApiKey = r.value;
      if (r.key === 'resend_from_email' && r.value) fromEmail = r.value;
    }
  } catch (err) {
    console.warn('System settings read note (using fallback env):', err);
  }

  const cleanGmailUser = (gmailUser || '').trim();
  const cleanGmailPass = (gmailPass || '').trim().replace(/\s+/g, '');
  const cleanResendKey = (resendApiKey || '').trim();

  return {
    gmailUser: cleanGmailUser || undefined,
    gmailPass: cleanGmailPass || undefined,
    resendApiKey: cleanResendKey || undefined,
    fromEmail: fromEmail.trim(),
    isReady: Boolean((cleanGmailUser && cleanGmailPass) || cleanResendKey)
  };
}

export interface SendCollectorWelcomeEmailParams {
  to: string;
  fullName: string;
  username: string;
  tempPassword: string;
  portalUrl?: string;
}

export async function sendCollectorWelcomeEmail({
  to,
  fullName,
  username,
  tempPassword,
  portalUrl = 'https://recovery-credit-6.vercel.app/login'
}: SendCollectorWelcomeEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const settings = await getEmailSettings();

    if (!settings.isReady) {
      console.warn('[Email] Neither Gmail SMTP nor Resend API is configured.');
      return { success: false, error: 'Email service is not configured.' };
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Recovery Credit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #0f172a; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">RECOVERY CREDIT</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Authorized Recovery Officer Portal</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">Welcome to the Team, ${fullName}</h2>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #475569;">
                An administrator has registered your official debt collection account on the <strong>Recovery Credit Management Platform</strong>.
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Your Access Credentials</p>
                    <div style="margin-bottom: 10px;">
                      <span style="font-size: 12px; color: #64748b;">Username / ID:</span><br>
                      <strong style="font-size: 14px; color: #0f172a; font-family: monospace;">${username}</strong>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 12px; color: #64748b;">One-Time Temporary Password:</span><br>
                      <strong style="display: inline-block; padding: 6px 12px; background-color: #e0f2fe; color: #0369a1; font-size: 16px; font-weight: 700; border-radius: 8px; font-family: monospace; letter-spacing: 0.06em; margin-top: 4px;">${tempPassword}</strong>
                    </div>
                    <div>
                      <span style="font-size: 12px; color: #64748b;">Portal Web Address:</span><br>
                      <a href="${portalUrl}" style="font-size: 13px; color: #2563eb; text-decoration: none; word-break: break-all;">${portalUrl}</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Policy Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #92400e;">
                  <strong>Required Security Step:</strong> This password is a one-time credential. In compliance with credit data protection standards, you will be required to choose a new permanent password immediately upon your first sign in.
                </p>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                      Sign In to Recovery Credit Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8;">
                Recovery Credit &bull; Credit Portfolio Recovery & Debtor Management
              </p>
              <p style="margin: 0; font-size: 10px; color: #cbd5e1;">
                This email was sent to ${to}. Please do not reply directly to this automated security dispatch.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. Primary Method: Gmail SMTP (No domain restrictions, delivers to all recipients)
    if (settings.gmailUser && settings.gmailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: settings.gmailUser,
            pass: settings.gmailPass
          }
        });

        const info = await transporter.sendMail({
          from: `"Recovery Credit" <${settings.gmailUser}>`,
          to,
          subject: `Welcome to Recovery Credit - Your One-Time Password (${username})`,
          html: htmlContent
        });

        console.log('[Email] Dispatched via Gmail SMTP:', info.messageId);
        return { success: true, id: info.messageId };
      } catch (gmailErr: any) {
        console.warn('[Email] Gmail SMTP attempt notice, trying fallback:', gmailErr?.message || gmailErr);
      }
    }

    // 2. Secondary Method: Resend API
    if (settings.resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: settings.fromEmail,
          to: [to],
          subject: `Welcome to Recovery Credit - Your One-Time Password (${username})`,
          html: htmlContent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.message || data?.error?.message || `Resend error (${response.status})`;
        console.warn('[Email] Resend API error:', errMsg, data);
        return { success: false, error: errMsg };
      }

      console.log('[Email] Dispatched via Resend API:', data?.id);
      return { success: true, id: data?.id };
    }

    return { success: false, error: 'No active email provider succeeded.' };
  } catch (error: any) {
    console.error('[Email] Unexpected email sending error:', error);
    return { success: false, error: error.message || 'Failed to dispatch email' };
  }
}
