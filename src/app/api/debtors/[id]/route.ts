import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Debtor } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await sql`SELECT * FROM debtors WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
    }

    const r = rows[0];
    const debtor: Debtor = {
      id: r.id,
      accountNumber: r.account_number,
      customerId: r.customer_id,
      debtorName: r.debtor_name,
      clientName: r.client_name,
      bankName: r.bank_name,
      outstandingAmount: Number(r.outstanding_amount || 0),
      paidAmount: Number(r.paid_amount || 0),
      outstandingBalance: Number(r.outstanding_balance || 0),
      dateOfPayment: r.date_of_payment || '',
      whatsappNumber: r.whatsapp_number || '',
      category: r.category,
      colorFlag: r.color_flag,
      assignedCollector: r.assigned_collector || '',
      notes: r.notes || '',
      createdBy: r.created_by || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };

    return NextResponse.json({ debtor });
  } catch (error: any) {
    console.error('API /api/debtors/[id] GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingRows = await sql`SELECT * FROM debtors WHERE id = ${id} LIMIT 1`;
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
    }

    const existing = existingRows[0];
    let outstandingAmount = 'outstandingAmount' in body ? Number(body.outstandingAmount || 0) : Number(existing.outstanding_amount);
    let paidAmount = 'paidAmount' in body ? Number(body.paidAmount || 0) : Number(existing.paid_amount);

    // SECURITY ENFORCEMENT: If the requester is a collector, they cannot edit previously recorded paidAmount
    if (body.actorRole === 'collector') {
      paidAmount = Number(existing.paid_amount);
    }

    if (paidAmount > outstandingAmount) {
      paidAmount = outstandingAmount;
    }
    const outstandingBalance = Math.max(0, outstandingAmount - paidAmount);

    let category = body.category !== undefined ? body.category : existing.category;
    if (outstandingBalance <= 0 && outstandingAmount > 0) {
      category = 'completed';
    }

    await sql`
      UPDATE debtors
      SET
        account_number = ${body.accountNumber !== undefined ? body.accountNumber : existing.account_number},
        customer_id = ${body.customerId !== undefined ? body.customerId : existing.customer_id},
        debtor_name = ${body.debtorName !== undefined ? body.debtorName : existing.debtor_name},
        client_name = ${body.clientName !== undefined ? body.clientName : existing.client_name},
        bank_name = ${body.bankName !== undefined ? body.bankName : existing.bank_name},
        outstanding_amount = ${outstandingAmount},
        paid_amount = ${paidAmount},
        outstanding_balance = ${outstandingBalance},
        date_of_payment = ${body.dateOfPayment !== undefined ? body.dateOfPayment : existing.date_of_payment},
        whatsapp_number = ${body.whatsappNumber !== undefined ? body.whatsappNumber : existing.whatsapp_number},
        category = ${category},
        color_flag = ${body.colorFlag !== undefined ? body.colorFlag : existing.color_flag},
        assigned_collector = ${body.assignedCollector !== undefined ? body.assignedCollector : existing.assigned_collector},
        notes = ${body.notes !== undefined ? body.notes : existing.notes},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    // Audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${body.actorUsername || 'admin'},
        ${body.actorUsername || 'admin'},
        ${body.actorFullName || 'Admin User'},
        ${body.actorRole || 'admin'},
        'update_debtor',
        'debtor',
        ${id},
        ${`${existing.debtor_name} (${existing.client_name})`},
        ${`Updated debtor in Neon. Category: ${category}, Balance: R ${outstandingBalance.toFixed(2)}.`}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/debtors/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await sql`SELECT * FROM debtors WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
    }

    await sql`DELETE FROM debtors WHERE id = ${id}`;

    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        'admin',
        'admin',
        'Administrator',
        'admin',
        'delete_debtor',
        'debtor',
        ${id},
        ${`${existing[0].debtor_name} (${existing[0].account_number})`},
        ${`Deleted debtor file permanently from Neon.`}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/debtors/[id] DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
