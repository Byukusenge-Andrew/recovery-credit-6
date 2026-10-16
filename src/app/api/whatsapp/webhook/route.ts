import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const DEFAULT_VERIFY_TOKEN = 'recovery_credit_webhook_secret_2026';

/**
 * GET Handler: Meta Webhook Verification handshake
 * Meta queries this endpoint with hub.mode, hub.verify_token, hub.challenge
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('Meta Webhook verified successfully!');
    return new Response(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return new Response('Forbidden', { status: 403 });
}

/**
 * POST Handler: Handles incoming WhatsApp messages and delivery status updates
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log incoming webhook event for diagnostic tracking
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;

          // 1. Process delivery statuses (sent, delivered, read, failed)
          if (value?.statuses) {
            for (const status of value.statuses) {
              console.log(`WhatsApp Status: ${status.status} for recipient ${status.recipient_id}`);
            }
          }

          // 2. Process incoming debtor reply messages
          if (value?.messages) {
            for (const msg of value.messages) {
              const senderPhone = msg.from;
              const textBody = msg.text?.body || msg.type;
              console.log(`Incoming message from ${senderPhone}: ${textBody}`);

              // Attempt to link to debtor if phone matches
              try {
                const debtorRows = await sql`
                  SELECT id, debtor_name FROM debtors 
                  WHERE whatsapp_number LIKE ${'%' + senderPhone.slice(-8) + '%'} 
                  LIMIT 1
                `;

                if (debtorRows.length > 0) {
                  const debtor = debtorRows[0];
                  await sql`
                    INSERT INTO activities (id, debtor_id, activity_type, description, scheduled_date, created_by, created_at)
                    VALUES (
                      ${crypto.randomUUID()},
                      ${debtor.id},
                      'note',
                      ${`[WhatsApp Incoming Reply] "${textBody}"`},
                      ${new Date().toISOString().split('T')[0]},
                      ${'Debtor (' + debtor.debtor_name + ')'},
                      NOW()
                    )
                  `;
                }
              } catch (linkErr) {
                console.warn('Could not auto-link incoming WhatsApp message to debtor:', linkErr);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'ERROR', error: error.message }, { status: 500 });
  }
}
