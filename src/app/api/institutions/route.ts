import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { FinancialInstitution } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = (searchParams.get('role') || request.headers.get('x-user-role') || 'admin').toLowerCase();
    const username = searchParams.get('username') || request.headers.get('x-username') || '';
    const fullName = searchParams.get('fullName') || '';

    // Auto-sync distinct institutions from debtors table if not yet present
    const unmappedClients = await sql`
      SELECT DISTINCT client_name 
      FROM debtors 
      WHERE client_name IS NOT NULL AND client_name != '' 
        AND LOWER(client_name) NOT IN (SELECT LOWER(name) FROM financial_institutions)
    `;

    for (const c of unmappedClients as any[]) {
      const id = 'inst-' + crypto.randomUUID().slice(0, 8);
      await sql`
        INSERT INTO financial_institutions (id, name, institution_type, created_at)
        VALUES (${id}, ${c.client_name}, 'commercial_bank', NOW())
        ON CONFLICT (name) DO NOTHING
      `;
    }

    let rows: any[] = [];

    // Role-based data isolation
    if (role === 'collector') {
      let collectorKeys = [username.toLowerCase(), fullName.toLowerCase()].filter(Boolean);
      if (username) {
        const uRows = await sql`SELECT username, full_name FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
        if (uRows.length > 0) {
          if (uRows[0].username) collectorKeys.push(uRows[0].username.toLowerCase());
          if (uRows[0].full_name) collectorKeys.push(uRows[0].full_name.toLowerCase());
        }
      }
      collectorKeys = Array.from(new Set(collectorKeys));

      if (collectorKeys.length === 0) {
        return NextResponse.json({ institutions: [] });
      }

      // Query ONLY institutions where this collector has assigned debts, and calculate metrics ONLY for their assigned debts
      rows = await sql.query(`
        SELECT 
          fi.id,
          fi.name,
          fi.code,
          fi.institution_type,
          fi.contact_person,
          fi.email,
          fi.phone,
          fi.address,
          fi.notes,
          fi.created_at,
          COUNT(d.id)::int AS debtors_count,
          COALESCE(SUM(d.outstanding_amount), 0)::float AS total_outstanding,
          COALESCE(SUM(d.paid_amount), 0)::float AS total_paid,
          COALESCE(SUM(d.outstanding_balance), 0)::float AS total_balance
        FROM financial_institutions fi
        INNER JOIN debtors d ON (d.institution_id = fi.id OR LOWER(d.client_name) = LOWER(fi.name))
          AND (LOWER(d.assigned_collector) = ANY($1))
        GROUP BY fi.id, fi.name, fi.code, fi.institution_type, fi.contact_person, fi.email, fi.phone, fi.address, fi.notes, fi.created_at
        ORDER BY fi.name ASC
      `, [collectorKeys]);
    } else {
      // Admin: View all institutions and full agency-wide totals
      rows = await sql`
        SELECT 
          fi.id,
          fi.name,
          fi.code,
          fi.institution_type,
          fi.contact_person,
          fi.email,
          fi.phone,
          fi.address,
          fi.notes,
          fi.created_at,
          COUNT(d.id)::int AS debtors_count,
          COALESCE(SUM(d.outstanding_amount), 0)::float AS total_outstanding,
          COALESCE(SUM(d.paid_amount), 0)::float AS total_paid,
          COALESCE(SUM(d.outstanding_balance), 0)::float AS total_balance
        FROM financial_institutions fi
        LEFT JOIN debtors d ON d.institution_id = fi.id OR LOWER(d.client_name) = LOWER(fi.name)
        GROUP BY fi.id, fi.name, fi.code, fi.institution_type, fi.contact_person, fi.email, fi.phone, fi.address, fi.notes, fi.created_at
        ORDER BY fi.created_at DESC
      `;
    }

    const institutions = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code || '',
      institutionType: r.institution_type || 'commercial_bank',
      contactPerson: r.contact_person || '',
      email: r.email || '',
      phone: r.phone || '',
      address: r.address || '',
      notes: r.notes || '',
      createdAt: r.created_at,
      metrics: {
        debtorsCount: Number(r.debtors_count || 0),
        totalOutstanding: Number(r.total_outstanding || 0),
        totalPaid: Number(r.total_paid || 0),
        totalBalance: Number(r.total_balance || 0),
        recoveryRate: Number(r.total_outstanding) > 0 
          ? Math.min(100, Math.round((Number(r.total_paid) / Number(r.total_outstanding)) * 100))
          : 0
      }
    }));

    return NextResponse.json({ institutions });
  } catch (error: any) {
    console.error('API /api/institutions GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userRole = (request.headers.get('x-user-role') || '').toLowerCase();
    if (userRole === 'collector') {
      return NextResponse.json({ error: 'Permission denied: Only administrators can create financial institutions.' }, { status: 403 });
    }

    const data = await request.json();
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Institution name is required' }, { status: 400 });
    }

    const name = data.name.trim();
    const existing = await sql`
      SELECT id FROM financial_institutions WHERE LOWER(name) = LOWER(${name}) LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: `An institution named "${name}" already exists.` }, { status: 409 });
    }

    const id = data.id || 'inst-' + crypto.randomUUID().slice(0, 8);
    const code = data.code ? data.code.trim().toUpperCase() : name.slice(0, 4).toUpperCase();

    await sql`
      INSERT INTO financial_institutions (
        id, name, code, institution_type, contact_person, email, phone, address, notes, created_at
      )
      VALUES (
        ${id},
        ${name},
        ${code},
        ${data.institutionType || 'commercial_bank'},
        ${data.contactPerson || ''},
        ${data.email || ''},
        ${data.phone || ''},
        ${data.address || ''},
        ${data.notes || ''},
        NOW()
      )
    `;

    // Audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${data.actorUsername || 'admin'},
        ${data.actorUsername || 'admin'},
        ${data.actorFullName || 'Administrator'},
        'admin',
        'create_institution',
        'institution',
        ${id},
        ${name},
        ${`Added new financial institution: ${name} (${data.institutionType || 'commercial_bank'}).`}
      )
    `;

    return NextResponse.json({ success: true, id, name });
  } catch (error: any) {
    console.error('API /api/institutions POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
