import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { resolveDebtorName } from '@/lib/debtorHealer';
import type { FinancialInstitution, Debtor } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const flag = searchParams.get('flag') || '';
    const collector = searchParams.get('collector') || '';
    const sortBy = searchParams.get('sortBy') || 'date_desc';

    // 1. Fetch institution
    const instRows = await sql`
      SELECT * FROM financial_institutions WHERE id = ${id} OR LOWER(name) = LOWER(${id}) LIMIT 1
    `;
    if (instRows.length === 0) {
      return NextResponse.json({ error: 'Financial institution not found' }, { status: 404 });
    }
    const r = instRows[0];
    const institution: FinancialInstitution = {
      id: r.id,
      name: r.name,
      code: r.code || '',
      institutionType: r.institution_type || 'commercial_bank',
      contactPerson: r.contact_person || '',
      email: r.email || '',
      phone: r.phone || '',
      address: r.address || '',
      notes: r.notes || '',
      createdAt: r.created_at
    };

    // 2. Fetch all debtors for this institution with dynamic filters
    let queryText = `
      SELECT * FROM debtors 
      WHERE (institution_id = $1 OR LOWER(client_name) = LOWER($2))
    `;
    const queryParams: any[] = [institution.id, institution.name];

    if (category && category !== 'all') {
      queryParams.push(category);
      queryText += ` AND category = $${queryParams.length}`;
    }

    if (flag && flag !== 'none') {
      queryParams.push(flag);
      queryText += ` AND color_flag = $${queryParams.length}`;
    }

    if (collector && collector !== 'all') {
      queryParams.push(collector.toLowerCase());
      queryText += ` AND LOWER(assigned_collector) = $${queryParams.length}`;
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      queryParams.push(q);
      const idx = queryParams.length;
      queryText += ` AND (
        LOWER(debtor_name) LIKE $${idx} OR 
        LOWER(account_number) LIKE $${idx} OR 
        LOWER(customer_id) LIKE $${idx} OR
        LOWER(whatsapp_number) LIKE $${idx}
      )`;
    }

    // Sorting
    switch (sortBy) {
      case 'balance_desc':
        queryText += ` ORDER BY outstanding_balance DESC`;
        break;
      case 'balance_asc':
        queryText += ` ORDER BY outstanding_balance ASC`;
        break;
      case 'amount_desc':
        queryText += ` ORDER BY outstanding_amount DESC`;
        break;
      case 'name_asc':
        queryText += ` ORDER BY debtor_name ASC`;
        break;
      case 'date_asc':
        queryText += ` ORDER BY created_at ASC`;
        break;
      case 'date_desc':
      default:
        queryText += ` ORDER BY created_at DESC`;
        break;
    }

    const debtorRows = await sql.query(queryText, queryParams);

    const debtors: Debtor[] = (debtorRows as any[]).map(d => ({
      id: d.id,
      accountNumber: d.account_number,
      customerId: d.customer_id,
      debtorName: resolveDebtorName(d.account_number, d.debtor_name, d.client_name, d.id),
      clientName: d.client_name,
      bankName: d.bank_name || d.client_name,
      institutionId: d.institution_id || institution.id,
      outstandingAmount: Number(d.outstanding_amount || 0),
      paidAmount: Number(d.paid_amount || 0),
      outstandingBalance: Number(d.outstanding_balance || 0),
      dateOfPayment: d.date_of_payment || '',
      whatsappNumber: d.whatsapp_number || '',
      category: d.category,
      colorFlag: d.color_flag,
      assignedCollector: d.assigned_collector || '',
      notes: d.notes || '',
      createdBy: d.created_by || '',
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));

    // 3. Overall Institution Metrics across ALL debtors of this institution
    const allInstDebtors = await sql`
      SELECT outstanding_amount, paid_amount, outstanding_balance, category, color_flag, assigned_collector
      FROM debtors 
      WHERE (institution_id = ${institution.id} OR LOWER(client_name) = LOWER(${institution.name}))
    `;

    const metrics = {
      totalDebtors: allInstDebtors.length,
      totalOutstanding: 0,
      totalPaid: 0,
      totalBalance: 0,
      recoveryRate: 0,
      assignedCollectors: Array.from(new Set(allInstDebtors.map(d => d.assigned_collector).filter(Boolean))),
      categoryBreakdown: {} as Record<string, number>,
      flagBreakdown: {} as Record<string, number>
    };

    allInstDebtors.forEach(d => {
      metrics.totalOutstanding += Number(d.outstanding_amount || 0);
      metrics.totalPaid += Number(d.paid_amount || 0);
      metrics.totalBalance += Number(d.outstanding_balance || 0);

      metrics.categoryBreakdown[d.category] = (metrics.categoryBreakdown[d.category] || 0) + 1;
      metrics.flagBreakdown[d.color_flag] = (metrics.flagBreakdown[d.color_flag] || 0) + 1;
    });

    if (metrics.totalOutstanding > 0) {
      metrics.recoveryRate = Math.min(100, Math.round((metrics.totalPaid / metrics.totalOutstanding) * 100));
    }

    return NextResponse.json({ institution, debtors, metrics });
  } catch (error: any) {
    console.error('API /api/institutions/[id] GET error:', error);
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

    await sql`
      UPDATE financial_institutions
      SET
        name = COALESCE(${body.name}, name),
        code = COALESCE(${body.code}, code),
        institution_type = COALESCE(${body.institutionType}, institution_type),
        contact_person = COALESCE(${body.contactPerson}, contact_person),
        email = COALESCE(${body.email}, email),
        phone = COALESCE(${body.phone}, phone),
        address = COALESCE(${body.address}, address),
        notes = COALESCE(${body.notes}, notes)
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/institutions/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
