import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { resolveDebtorName } from '@/lib/debtorHealer';
import type { Debtor } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const flag = searchParams.get('flag') || '';
    const client = searchParams.get('client') || '';
    const verifiedRole = request.headers.get('x-verified-role');
    const verifiedUsername = request.headers.get('x-verified-username');

    // Role-based access enforcement: Collectors can NEVER escalate to view unassigned debtors
    const isCollector = verifiedRole === 'collector';
    const effectiveRole = isCollector ? 'collector' : (searchParams.get('role') || verifiedRole || 'admin');
    const effectiveUsername = isCollector
      ? (verifiedUsername || '')
      : (searchParams.get('username') || verifiedUsername || '');

    let queryText = `SELECT * FROM debtors WHERE 1=1`;
    const params: any[] = [];

    // Role-based data isolation: Collectors strictly see ONLY dossiers assigned to them
    if (effectiveRole === 'collector') {
      const collectorUser = (effectiveUsername || searchParams.get('username') || '').trim().toLowerCase();
      if (!collectorUser) {
        return NextResponse.json({ debtors: [] });
      }
      let allowedNames = [collectorUser];
      try {
        const u = await sql`SELECT username, full_name FROM users WHERE LOWER(username) = ${collectorUser} LIMIT 1`;
        if (u.length > 0) {
          if (u[0].username) allowedNames.push(String(u[0].username).trim().toLowerCase());
          if (u[0].full_name) allowedNames.push(String(u[0].full_name).trim().toLowerCase());
        }
      } catch (_) {}
      const uniqueNames = Array.from(new Set(allowedNames.filter(Boolean)));
      const namePlaceholders = uniqueNames.map(n => {
        params.push(n);
        return `$${params.length}`;
      }).join(', ');
      queryText += ` AND LOWER(assigned_collector) IN (${namePlaceholders})`;
    }

    if (client) {
      params.push(client.toLowerCase());
      queryText += ` AND LOWER(client_name) = $${params.length}`;
    }

    if (category && category !== 'all') {
      params.push(category);
      queryText += ` AND category = $${params.length}`;
    }

    if (flag && flag !== 'none') {
      params.push(flag);
      queryText += ` AND color_flag = $${params.length}`;
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      params.push(q);
      const idx = params.length;
      queryText += ` AND (
        LOWER(debtor_name) LIKE $${idx} OR 
        LOWER(client_name) LIKE $${idx} OR 
        LOWER(account_number) LIKE $${idx} OR 
        LOWER(customer_id) LIKE $${idx}
      )`;
    }

    queryText += ` ORDER BY created_at DESC`;

    const rows = await sql.query(queryText, params);

    const debtors: Debtor[] = (rows as any[]).map(r => ({
      id: r.id,
      accountNumber: r.account_number,
      customerId: r.customer_id,
      debtorName: resolveDebtorName(r.account_number, r.debtor_name, r.client_name, r.id),
      clientName: r.client_name,
      bankName: r.bank_name || r.client_name,
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
    }));

    return NextResponse.json({ debtors });
  } catch (error: any) {
    console.error('API /api/debtors GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const verifiedRole = request.headers.get('x-verified-role');
    const verifiedUsername = request.headers.get('x-verified-username');

    const data = await request.json();
    const id = data.id || crypto.randomUUID();
    const outstandingAmount = Math.max(0, Number(data.outstandingAmount || 0));
    const paidAmount = Math.min(outstandingAmount, Math.max(0, Number(data.paidAmount || 0)));
    const outstandingBalance = outstandingAmount - paidAmount;
    const now = new Date().toISOString();

    // RBAC: If requester is a collector, automatically lock assignment to their own username
    const assignedCollector = verifiedRole === 'collector' && verifiedUsername
      ? verifiedUsername
      : (data.assignedCollector || '');
    const createdBy = verifiedUsername || data.createdBy || 'Admin';

    await sql`
      INSERT INTO debtors (
        id, account_number, customer_id, debtor_name, client_name, bank_name, institution_id,
        outstanding_amount, paid_amount, outstanding_balance, date_of_payment,
        whatsapp_number, category, color_flag, assigned_collector, notes, created_by,
        created_at, updated_at
      )
      VALUES (
        ${id},
        ${data.accountNumber || ''},
        ${data.customerId || ''},
        ${data.debtorName || data.clientName || ''},
        ${data.clientName || ''},
        ${data.bankName || data.clientName || ''},
        ${data.institutionId || null},
        ${outstandingAmount},
        ${paidAmount},
        ${outstandingBalance},
        ${data.dateOfPayment || ''},
        ${data.whatsappNumber || ''},
        ${data.category || 'paying'},
        ${data.colorFlag || 'none'},
        ${assignedCollector},
        ${data.notes || ''},
        ${createdBy},
        ${now},
        ${now}
      )
    `;

    // Audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${data.createdBy || 'admin'},
        ${data.createdBy || 'admin'},
        ${data.createdBy || 'Administrator'},
        'admin',
        'create_debtor',
        'debtor',
        ${id},
        ${`${data.debtorName || ''} (${data.clientName || ''} - ${data.accountNumber || ''})`},
        ${`Created debtor record. Claim: R ${outstandingAmount.toFixed(2)}, Assigned: @${data.assignedCollector || 'Unassigned'}.`}
      )
    `;

    // Trigger notification if assigned
    if (data.assignedCollector) {
      await sql`
        INSERT INTO notifications (id, recipient_username, title, message, debtor_id, debtor_name, client_name, amount, is_read, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${data.assignedCollector},
          'New Debtor Case Assigned',
          ${`You have been assigned to recover a balance of R ${outstandingBalance.toFixed(2)} for ${data.debtorName || ''}.`},
          ${id},
          ${data.debtorName || ''},
          ${data.clientName || ''},
          ${outstandingBalance},
          FALSE,
          NOW()
        )
      `;
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API /api/debtors POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
