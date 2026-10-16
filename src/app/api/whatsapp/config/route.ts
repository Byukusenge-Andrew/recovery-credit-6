import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getWhatsAppSettings } from '@/lib/whatsapp';

function maskSecret(str: string): string {
  if (!str) return '';
  if (str.length <= 8) return '****';
  return str.slice(0, 6) + '****' + str.slice(-4);
}

export async function GET() {
  try {
    const config = await getWhatsAppSettings();

    // Verify Meta App with App Credentials
    let metaAppStatus: { connected: boolean; appName?: string; category?: string; error?: string } = {
      connected: false
    };

    try {
      const appTokenUrl = `https://graph.facebook.com/oauth/access_token?client_id=${config.metaAppId}&client_secret=${config.metaAppSecret}&grant_type=client_credentials`;
      const tokenRes = await fetch(appTokenUrl);
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const appToken = tokenData.access_token;
        if (appToken) {
          const appInfoRes = await fetch(`https://graph.facebook.com/v21.0/${config.metaAppId}?access_token=${appToken}`);
          if (appInfoRes.ok) {
            const appInfo = await appInfoRes.json();
            metaAppStatus = {
              connected: true,
              appName: appInfo.name || 'RecoveryCredit',
              category: appInfo.category || 'Business'
            };
          }
        }
      }
    } catch (err: any) {
      metaAppStatus = {
        connected: false,
        error: err.message
      };
    }

    // Verify User Access Token if supplied
    let userTokenStatus: { valid: boolean; expiresAt?: string; error?: string } | null = null;
    if (config.accessToken) {
      try {
        const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${config.accessToken}`);
        if (meRes.ok) {
          userTokenStatus = { valid: true };
        } else {
          const errData = await meRes.json();
          userTokenStatus = {
            valid: false,
            error: errData?.error?.message || 'Access token invalid or expired'
          };
        }
      } catch (err: any) {
        userTokenStatus = { valid: false, error: err.message };
      }
    }

    return NextResponse.json({
      metaAppId: config.metaAppId,
      metaAppSecretMasked: maskSecret(config.metaAppSecret),
      hasAppSecret: Boolean(config.metaAppSecret),
      phoneNumberId: config.phoneNumberId,
      phoneNumberIdMasked: maskSecret(config.phoneNumberId),
      hasPhoneNumberId: Boolean(config.phoneNumberId),
      hasAccessToken: Boolean(config.accessToken),
      businessAccountId: config.businessAccountId,
      isCloudApiReady: config.isCloudApiReady,
      metaAppStatus,
      userTokenStatus
    });
  } catch (error: any) {
    console.error('WhatsApp config GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      phoneNumberId,
      accessToken,
      businessAccountId,
      metaAppId,
      metaAppSecret,
      testOnly
    } = body;

    // Test token validity if provided
    if (testOnly && accessToken) {
      try {
        const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
        const data = await meRes.json();
        if (!meRes.ok) {
          return NextResponse.json({
            success: false,
            error: data?.error?.message || 'Invalid WhatsApp Access Token'
          }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          message: 'Access token validated successfully against Meta Graph API!'
        });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }
    }

    // Save configurations into system_settings table
    const updates: { key: string; val: string }[] = [];

    if (phoneNumberId !== undefined) updates.push({ key: 'whatsapp_phone_number_id', val: phoneNumberId.trim() });
    if (accessToken !== undefined && accessToken.trim()) updates.push({ key: 'whatsapp_access_token', val: accessToken.trim() });
    if (businessAccountId !== undefined) updates.push({ key: 'whatsapp_business_account_id', val: businessAccountId.trim() });
    if (metaAppId !== undefined && metaAppId.trim()) updates.push({ key: 'meta_app_id', val: metaAppId.trim() });
    if (metaAppSecret !== undefined && metaAppSecret.trim()) updates.push({ key: 'meta_app_secret', val: metaAppSecret.trim() });

    for (const item of updates) {
      await sql`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (${item.key}, ${item.val}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
    }

    // Audit log
    try {
      await sql`
        INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
        VALUES (
          ${'aud-wa-cfg-' + Date.now()},
          NOW(),
          'admin',
          'admin',
          'System Admin',
          'admin',
          'UPDATE_WHATSAPP_CONFIG',
          'system_setting',
          'whatsapp',
          'WhatsApp Cloud API Configuration',
          ${`Updated settings: ${updates.map(u => u.key).join(', ')}`}
        )
      `;
    } catch (auditErr) {
      console.warn('Config audit log warning:', auditErr);
    }

    const newConfig = await getWhatsAppSettings();

    return NextResponse.json({
      success: true,
      message: 'WhatsApp Cloud API settings saved successfully.',
      isCloudApiReady: newConfig.isCloudApiReady
    });
  } catch (error: any) {
    console.error('WhatsApp config POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
