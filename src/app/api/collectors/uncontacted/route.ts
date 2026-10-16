import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Debtor } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collector = searchParams.get('collector');

    if (!collector) {
      return NextResponse.json({ error: 'Collector username is required' }, { status: 400 });
    }

    const cleanCollector = collector.trim().toLowerCase();

    // Fetch debtors assigned to this collector who have NO activities recorded
    const rows = await sql`
      SELECT 
        d.id,
        d.account_number AS "accountNumber",
        d.customer_id AS "customerId",
        d.debtor_name AS "debtorName",
        d.client_name AS "clientName",
        d.bank_name AS "bankName",
        d.institution_id AS "institutionId",
        d.outstanding_amount::numeric AS "outstandingAmount",
        d.paid_amount::numeric AS "paidAmount",
        d.outstanding_balance::numeric AS "outstandingBalance",
        d.date_of_payment AS "dateOfPayment",
        d.whatsapp_number AS "whatsappNumber",
        d.category,
        d.color_flag AS "colorFlag",
        d.assigned_collector AS "assignedCollector",
        d.notes,
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt",
        d.created_by AS "createdBy"
      FROM debtors d
      WHERE (LOWER(d.assigned_collector) = ${cleanCollector})
        AND NOT EXISTS (
          SELECT 1 FROM activities a WHERE a.debtor_id = d.id
        )
      ORDER BY d.outstanding_balance DESC
      LIMIT 100
    `;

    const debtors: Debtor[] = rows.map((r: any) => ({
      id: r.id,
      accountNumber: r.accountNumber,
      customerId: r.customerId,
      debtorName: r.debtorName,
      clientName: r.clientName,
      bankName: r.bankName || r.clientName,
      institutionId: r.institutionId,
      outstandingAmount: Number(r.outstandingAmount) || 0,
      paidAmount: Number(r.paidAmount) || 0,
      dateOfPayment: r.dateOfPayment || '',
      outstandingBalance: Number(r.outstandingBalance) || 0,
      whatsappNumber: r.whatsappNumber || '',
      category: r.category,
      colorFlag: r.colorFlag,
      assignedCollector: r.assignedCollector,
      notes: r.notes || '',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
      createdBy: r.createdBy || ''
    }));

    return NextResponse.json({ debtors });
  } catch (error: any) {
    console.error('API /api/collectors/uncontacted GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
