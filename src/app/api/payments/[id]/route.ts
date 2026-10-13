import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { amountPaid, paymentDate, notes, adminUsername } = await request.json();

    const paymentRows = await sql`SELECT * FROM payments WHERE id = ${id} LIMIT 1`;
    if (paymentRows.length === 0) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }
    const oldPayment = paymentRows[0];

    const debtorRows = await sql`SELECT * FROM debtors WHERE id = ${oldPayment.debtor_id} LIMIT 1`;
    if (debtorRows.length === 0) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
    }
    const debtor = debtorRows[0];

    let newAmt = typeof amountPaid === 'number' ? Math.max(0, amountPaid) : Number(oldPayment.amount_paid);
    const diff = newAmt - Number(oldPayment.amount_paid);
    const newPaidTotal = Math.max(0, Number(debtor.paid_amount || 0) + diff);

    if (newPaidTotal > Number(debtor.outstanding_amount)) {
      return NextResponse.json({ 
        error: `Updated payment would exceed the total loan amount of R ${Number(debtor.outstanding_amount).toFixed(2)}.` 
      }, { status: 400 });
    }

    const newBal = Math.max(0, Number(debtor.outstanding_amount) - newPaidTotal);

    await sql`
      UPDATE payments
      SET amount_paid = ${newAmt}, payment_date = ${paymentDate || oldPayment.payment_date}, notes = ${notes !== undefined ? notes : oldPayment.notes}
      WHERE id = ${id}
    `;

    await sql`
      UPDATE debtors
      SET paid_amount = ${newPaidTotal}, outstanding_balance = ${newBal}, updated_at = NOW()
      WHERE id = ${debtor.id}
    `;

    // Immutable audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${adminUsername || 'admin'},
        ${adminUsername || 'admin'},
        'Administrator',
        'admin',
        'update_payment',
        'payment',
        ${id},
        ${`Payment edit for ${debtor.debtor_name}`},
        ${`Admin adjusted payment from R ${Number(oldPayment.amount_paid).toFixed(2)} to R ${newAmt.toFixed(2)}.`}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/payments/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paymentRows = await sql`SELECT * FROM payments WHERE id = ${id} LIMIT 1`;
    if (paymentRows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    const payment = paymentRows[0];

    const debtorRows = await sql`SELECT * FROM debtors WHERE id = ${payment.debtor_id} LIMIT 1`;
    if (debtorRows.length > 0) {
      const debtor = debtorRows[0];
      const newPaid = Math.max(0, Number(debtor.paid_amount || 0) - Number(payment.amount_paid));
      const newBal = Math.max(0, Number(debtor.outstanding_amount) - newPaid);
      await sql`
        UPDATE debtors
        SET paid_amount = ${newPaid}, outstanding_balance = ${newBal}, updated_at = NOW()
        WHERE id = ${debtor.id}
      `;
    }

    await sql`DELETE FROM payments WHERE id = ${id}`;

    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        'admin',
        'admin',
        'Administrator',
        'admin',
        'delete_payment',
        'payment',
        ${id},
        ${`Payment deleted: R ${Number(payment.amount_paid).toFixed(2)}`},
        ${`Admin deleted payment record from Neon PostgreSQL.`}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/payments/[id] DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
