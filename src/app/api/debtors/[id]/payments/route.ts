import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Payment } from '@/lib/types';

interface PaymentRow {
  id: string;
  debtor_id: string;
  amount_paid: number | string | null;
  payment_date: string;
  recorded_by: string;
  notes: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const verifiedRole = request.headers.get('x-verified-role');
    const verifiedUsername = request.headers.get('x-verified-username');

    if (verifiedRole === 'collector') {
      const debtorRows = await sql`SELECT assigned_collector FROM debtors WHERE id = ${id} LIMIT 1`;
      if (debtorRows.length === 0) {
        return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
      }
      const assigned = (debtorRows[0].assigned_collector || '').trim().toLowerCase();
      const user = (verifiedUsername || '').trim().toLowerCase();
      if (!user || !assigned) {
        return NextResponse.json({ error: 'Forbidden: Dossier is not assigned to you' }, { status: 403 });
      }
      const allowedNames = [user];
      try {
        const u = await sql`SELECT username, full_name FROM users WHERE LOWER(username) = ${user} LIMIT 1`;
        if (u.length > 0) {
          if (u[0].username) allowedNames.push(String(u[0].username).trim().toLowerCase());
          if (u[0].full_name) allowedNames.push(String(u[0].full_name).trim().toLowerCase());
        }
      } catch {}
      if (!allowedNames.includes(assigned)) {
        return NextResponse.json({ error: 'Forbidden: Dossier is not assigned to you' }, { status: 403 });
      }
    }

    const rows = await sql`SELECT * FROM payments WHERE debtor_id = ${id} ORDER BY created_at DESC`;
    const payments: Payment[] = (rows as unknown as PaymentRow[]).map(r => ({
      id: r.id,
      debtorId: r.debtor_id,
      amountPaid: Number(r.amount_paid || 0),
      paymentDate: r.payment_date,
      recordedBy: r.recorded_by,
      notes: r.notes || ''
    }));
    return NextResponse.json({ payments });
  } catch (error: unknown) {
    console.error('API /api/debtors/[id]/payments GET error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { amountPaid, paymentDate, notes, recordedBy } = body;

    const amt = Number(amountPaid || 0);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Payment amount must be a positive number greater than zero.' }, { status: 400 });
    }

    const debtorRows = await sql`SELECT * FROM debtors WHERE id = ${id} LIMIT 1`;
    if (debtorRows.length === 0) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
    }
    const debtor = debtorRows[0];

    // Authorization check: Collectors cannot record payments for debtors not assigned to them
    const verifiedRole = request.headers.get('x-verified-role');
    const verifiedUsername = request.headers.get('x-verified-username');
    if (verifiedRole === 'collector') {
      const assigned = (debtor.assigned_collector || '').trim().toLowerCase();
      const user = (verifiedUsername || recordedBy || '').trim().toLowerCase();
      if (!user || !assigned) {
        return NextResponse.json({ error: 'Forbidden: You are not authorized to collect for this debtor account.' }, { status: 403 });
      }
      const allowedNames = [user];
      try {
        const u = await sql`SELECT username, full_name FROM users WHERE LOWER(username) = ${user} LIMIT 1`;
        if (u.length > 0) {
          if (u[0].username) allowedNames.push(String(u[0].username).trim().toLowerCase());
          if (u[0].full_name) allowedNames.push(String(u[0].full_name).trim().toLowerCase());
        }
      } catch {}
      if (!allowedNames.includes(assigned)) {
        return NextResponse.json({ error: 'Forbidden: You are not authorized to collect for this debtor account.' }, { status: 403 });
      }
    }

    const remaining = Number(debtor.outstanding_balance || 0);
    const finalAmt = amt > remaining ? remaining : amt;

    const paymentId = crypto.randomUUID();
    const pDate = paymentDate || new Date().toISOString().split('T')[0];
    const actor = verifiedUsername || recordedBy || 'Collector';

    // Insert payment
    await sql`
      INSERT INTO payments (id, debtor_id, amount_paid, payment_date, recorded_by, notes, created_at)
      VALUES (${paymentId}, ${id}, ${finalAmt}, ${pDate}, ${actor}, ${String(notes || '').slice(0, 500)}, NOW())
    `;

    // Recalculate debtor total paid and balance
    const newPaid = Number(debtor.paid_amount || 0) + finalAmt;
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

    const actorRole = verifiedRole || body.role || 'collector';

    // Audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${actor},
        ${actor},
        ${actor},
        ${actorRole},
        'record_payment',
        'payment',
        ${paymentId},
        ${`Payment for ${debtor.debtor_name}`},
        ${`Recorded payment of RWF ${finalAmt.toFixed(2)} on ${pDate}. Reference: ${notes || 'None'}.`}
      )
    `;

    return NextResponse.json({ success: true, paymentId });
  } catch (error: unknown) {
    console.error('API /api/debtors/[id]/payments POST error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
