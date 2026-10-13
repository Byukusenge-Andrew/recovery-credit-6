import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Payment } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await sql`SELECT * FROM payments WHERE debtor_id = ${id} ORDER BY created_at DESC`;
    const payments: Payment[] = rows.map((r: any) => ({
      id: r.id,
      debtorId: r.debtor_id,
      amountPaid: Number(r.amount_paid || 0),
      paymentDate: r.payment_date,
      recordedBy: r.recorded_by,
      notes: r.notes || ''
    }));
    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('API /api/debtors/[id]/payments GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { amountPaid, paymentDate, notes, recordedBy, role } = await request.json();

    const debtorRows = await sql`SELECT * FROM debtors WHERE id = ${id} LIMIT 1`;
    if (debtorRows.length === 0) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
    }
    const debtor = debtorRows[0];

    let amt = Number(amountPaid || 0);
    const remaining = Number(debtor.outstanding_balance || 0);
    if (amt > remaining) {
      amt = remaining;
    }

    const paymentId = crypto.randomUUID();
    const pDate = paymentDate || new Date().toISOString().split('T')[0];

    // Insert payment
    await sql`
      INSERT INTO payments (id, debtor_id, amount_paid, payment_date, recorded_by, notes, created_at)
      VALUES (${paymentId}, ${id}, ${amt}, ${pDate}, ${recordedBy || 'Collector'}, ${notes || ''}, NOW())
    `;

    // Recalculate debtor total paid and balance
    const newPaid = Number(debtor.paid_amount || 0) + amt;
    const newBal = Math.max(0, Number(debtor.outstanding_amount || 0) - newPaid);
    let category = debtor.category;
    if (newBal <= 0 && Number(debtor.outstanding_amount) > 0) {
      category = 'completed';
    }

    await sql`
      UPDATE debtors
      SET paid_amount = ${newPaid}, outstanding_balance = ${newBal}, category = ${category}, updated_at = NOW()
      WHERE id = ${id}
    `;

    // Audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${recordedBy || 'user'},
        ${recordedBy || 'user'},
        ${recordedBy || 'Collector'},
        ${role || 'collector'},
        'record_payment',
        'payment',
        ${paymentId},
        ${`Payment for ${debtor.debtor_name}`},
        ${`Recorded payment of R ${amt.toFixed(2)} on ${pDate}. Reference: ${notes || 'None'}.`}
      )
    `;

    return NextResponse.json({ success: true, paymentId });
  } catch (error: any) {
    console.error('API /api/debtors/[id]/payments POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
