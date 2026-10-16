import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendWhatsAppCloudMessage, generateWhatsAppLink, formatWhatsAppPhone, getWhatsAppSettings } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { debtorId, message, recipientPhone, mode = 'api', collectorName } = body;

    if (!debtorId) {
      return NextResponse.json({ error: 'Debtor ID is required' }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message body cannot be empty' }, { status: 400 });
    }

    // Load debtor
    const debtorRows = await sql`
      SELECT id, debtor_name, client_name, account_number, outstanding_balance, whatsapp_number, assigned_collector 
      FROM debtors 
      WHERE id = ${debtorId} 
      LIMIT 1
    `;

    if (debtorRows.length === 0) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
    }

    const debtor = debtorRows[0];
    const targetPhone = recipientPhone || debtor.whatsapp_number;

    if (!targetPhone) {
      return NextResponse.json({ error: 'Debtor has no WhatsApp phone number registered' }, { status: 400 });
    }

    const effectiveCollector = collectorName || debtor.assigned_collector || 'Recovery Officer';
    const today = new Date().toISOString().split('T')[0];
    const waLink = generateWhatsAppLink(targetPhone, message);

    let apiResult: { success: boolean; messageId?: string; error?: string } = { success: true };

    if (mode === 'api') {
      const config = await getWhatsAppSettings();
      if (!config.isCloudApiReady) {
        return NextResponse.json({
          success: false,
          needsConfiguration: true,
          error: 'WhatsApp Cloud API credentials (Phone Number ID & Access Token) are not yet configured in WhatsApp Settings. You can use 1-Click WhatsApp Web link or configure credentials in the settings dialog.',
          waLink
        }, { status: 400 });
      }

      apiResult = await sendWhatsAppCloudMessage({
        to: targetPhone,
        text: message
      });

      if (!apiResult.success) {
        return NextResponse.json({
          success: false,
          error: apiResult.error || 'Failed to send WhatsApp message via Meta Cloud API',
          waLink
        }, { status: 400 });
      }
    }

    // Automatically record interaction activity in database
    const activityId = crypto.randomUUID();
    const modeLabel = mode === 'api' ? 'Meta Cloud API' : 'WhatsApp Web';
    const noteSummary = `[WhatsApp ${modeLabel}] ${message.length > 120 ? message.slice(0, 120) + '...' : message}`;

    await sql`
      INSERT INTO activities (id, debtor_id, activity_type, description, scheduled_date, created_by, created_at)
      VALUES (
        ${activityId}, 
        ${debtorId}, 
        'reminder_sent', 
        ${noteSummary}, 
        ${today}, 
        ${effectiveCollector}, 
        NOW()
      )
    `;

    // Audit log
    try {
      await sql`
        INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
        VALUES (
          ${'aud-wa-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
          NOW(),
          ${effectiveCollector},
          ${effectiveCollector},
          ${effectiveCollector},
          'collector',
          'WHATSAPP_REMINDER_SENT',
          'debtor',
          ${debtorId},
          ${`Debtor: ${debtor.debtor_name} (${debtor.account_number})`},
          ${`Dispatched WhatsApp reminder to ${targetPhone} via ${modeLabel}. Message length: ${message.length} chars.`}
        )
      `;
    } catch (auditErr) {
      console.warn('WhatsApp audit log notice:', auditErr);
    }

    return NextResponse.json({
      success: true,
      mode,
      messageId: apiResult.messageId || null,
      waLink,
      formattedPhone: formatWhatsAppPhone(targetPhone).display,
      activityId
    });
  } catch (error: any) {
    console.error('WhatsApp API /api/whatsapp/send error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
