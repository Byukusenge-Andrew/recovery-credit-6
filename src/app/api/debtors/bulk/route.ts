import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Debtor } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { debtors, institutionId, institutionName, actorUsername, actorFullName } = body;

    if (!debtors || !Array.isArray(debtors) || debtors.length === 0) {
      return NextResponse.json({ error: 'No debtors data provided' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let insertedCount = 0;

    for (const d of debtors) {
      const outstandingAmount = Math.max(0, Number(d.outstandingAmount || 0));
      const paidAmount = Math.min(outstandingAmount, Math.max(0, Number(d.paidAmount || 0)));
      const outstandingBalance = outstandingAmount - paidAmount;
      const debtorInstId = d.institutionId || institutionId || null;
      const clientName = d.clientName || institutionName || 'Financial Institution';
      const debtorName = d.debtorName || d.accountNumber || 'Debtor';

      // Smart Upsert: Check if record with matching account_number already exists in database
      const existing = d.accountNumber
        ? await sql`SELECT id FROM debtors WHERE LOWER(account_number) = ${d.accountNumber.trim().toLowerCase()} LIMIT 1`
        : [];

      if (existing.length > 0) {
        const existingId = existing[0].id;
        await sql`
          UPDATE debtors SET
            debtor_name = ${debtorName},
            client_name = ${clientName},
            bank_name = ${d.bankName || clientName},
            institution_id = COALESCE(${debtorInstId}, debtors.institution_id),
            outstanding_amount = ${outstandingAmount},
            paid_amount = ${paidAmount},
            outstanding_balance = ${outstandingBalance},
            date_of_payment = ${d.dateOfPayment || ''},
            whatsapp_number = COALESCE(${d.whatsappNumber || null}, debtors.whatsapp_number),
            category = ${d.category || 'paying'},
            color_flag = ${d.colorFlag || 'none'},
            assigned_collector = COALESCE(${d.assignedCollector || null}, debtors.assigned_collector),
            notes = ${d.notes || 'Imported via CSV batch upload'},
            updated_at = NOW()
          WHERE id = ${existingId}
        `;
      } else {
        const id = d.id || crypto.randomUUID();
        await sql`
          INSERT INTO debtors (
            id, account_number, customer_id, debtor_name, client_name, bank_name, institution_id,
            outstanding_amount, paid_amount, outstanding_balance, date_of_payment,
            whatsapp_number, category, color_flag, assigned_collector, notes, created_by,
            created_at, updated_at
          )
          VALUES (
            ${id},
            ${d.accountNumber || ''},
            ${d.customerId || ''},
            ${debtorName},
            ${clientName},
            ${d.bankName || clientName},
            ${debtorInstId},
            ${outstandingAmount},
            ${paidAmount},
            ${outstandingBalance},
            ${d.dateOfPayment || ''},
            ${d.whatsappNumber || ''},
            ${d.category || 'paying'},
            ${d.colorFlag || 'none'},
            ${d.assignedCollector || ''},
            ${d.notes || 'Imported via CSV batch upload'},
            ${d.createdBy || actorUsername || 'Admin'},
            ${now},
            ${now}
          )
        `;
      }

      insertedCount++;
    }

    // Insert audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${actorUsername || 'admin'},
        ${actorUsername || 'admin'},
        ${actorFullName || 'Administrator'},
        'admin',
        'import_csv',
        'institution',
        ${institutionId || null},
        ${`Batch Upload: ${insertedCount} debtors ${institutionName ? `for ${institutionName}` : ''}`},
        ${`Bulk imported ${insertedCount} debtor record(s) into system database ledger.`}
      )
    `;

    return NextResponse.json({ success: true, count: insertedCount });
  } catch (error: any) {
    console.error('API /api/debtors/bulk error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
