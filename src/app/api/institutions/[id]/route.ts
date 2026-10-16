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
    const role = (searchParams.get('role') || request.headers.get('x-user-role') || 'admin').toLowerCase();
    const username = searchParams.get('username') || request.headers.get('x-username') || '';
    const fullName = searchParams.get('fullName') || '';

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

    // Collector Access Control & Scoping
    let collectorKeys: string[] = [];
    if (role === 'collector') {
      collectorKeys = [username.toLowerCase(), fullName.toLowerCase()].filter(Boolean);
      if (username) {
        const uRows = await sql`SELECT username, full_name FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
        if (uRows.length > 0) {
          if (uRows[0].username) collectorKeys.push(uRows[0].username.toLowerCase());
          if (uRows[0].full_name) collectorKeys.push(uRows[0].full_name.toLowerCase());
        }
      }
      collectorKeys = Array.from(new Set(collectorKeys));

      // Check if collector has any debtors for this institution
      const accessCheck = await sql.query(`
        SELECT 1 FROM debtors 
        WHERE (institution_id = $1 OR LOWER(client_name) = LOWER($2))
          AND (LOWER(assigned_collector) = ANY($3))
        LIMIT 1
      `, [institution.id, institution.name, collectorKeys]);

      if (accessCheck.length === 0) {
        return NextResponse.json(
          { error: 'Access denied: You do not have any assigned debtor accounts for this financial institution.' },
          { status: 403 }
        );
      }
    }

    // 2. Fetch debtors for this institution with dynamic filters
    let queryText = `
      SELECT * FROM debtors 
      WHERE (institution_id = $1 OR LOWER(client_name) = LOWER($2))
    `;
    const queryParams: any[] = [institution.id, institution.name];

    // If collector, strictly restrict to their assigned debtors
    if (role === 'collector') {
      queryParams.push(collectorKeys);
      queryText += ` AND (LOWER(assigned_collector) = ANY($${queryParams.length}))`;
    } else if (collector && collector !== 'all') {
      queryParams.push(collector.toLowerCase());
      queryText += ` AND LOWER(assigned_collector) = $${queryParams.length}`;
    }

    if (category && category !== 'all') {
      queryParams.push(category);
      queryText += ` AND category = $${queryParams.length}`;
    }

    if (flag && flag !== 'none') {
      queryParams.push(flag);
      queryText += ` AND color_flag = $${queryParams.length}`;
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

    // 3. Institution Metrics calculation
    // If collector: metrics calculated STRICTLY on this collector's assigned debts
    // If admin: metrics calculated across ALL debts for this institution
    let allInstDebtors: any[] = [];
    if (role === 'collector') {
      allInstDebtors = await sql.query(`
        SELECT outstanding_amount, paid_amount, outstanding_balance, category, color_flag, assigned_collector
        FROM debtors 
        WHERE (institution_id = $1 OR LOWER(client_name) = LOWER($2))
          AND (LOWER(assigned_collector) = ANY($3))
      `, [institution.id, institution.name, collectorKeys]);
    } else {
      allInstDebtors = await sql`
        SELECT outstanding_amount, paid_amount, outstanding_balance, category, color_flag, assigned_collector
        FROM debtors 
        WHERE (institution_id = ${institution.id} OR LOWER(client_name) = LOWER(${institution.name}))
      `;
    }

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

    return NextResponse.json({ institution, debtors, metrics, isCollectorScope: role === 'collector' });
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
    const userRole = (request.headers.get('x-user-role') || '').toLowerCase();
    if (userRole === 'collector') {
      return NextResponse.json({ error: 'Permission denied: Collectors cannot edit financial institutions.' }, { status: 403 });
    }

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
