import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Activity } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');

    const conditions: string[] = ['debtor_id = $1'];
    const values: any[] = [id];
    let paramIdx = 2;

    if (date && date.trim()) {
      conditions.push(`(scheduled_date = $${paramIdx} OR TO_CHAR(created_at, 'YYYY-MM-DD') = $${paramIdx})`);
      values.push(date.trim());
      paramIdx++;
    }

    if (type && type !== 'all') {
      conditions.push(`activity_type = $${paramIdx}`);
      values.push(type.trim());
      paramIdx++;
    }

    const queryText = `
      SELECT * FROM activities 
      WHERE ${conditions.join(' AND ')} 
      ORDER BY created_at DESC
    `;

    const rows = await sql.query(queryText, values);
    const activities: Activity[] = rows.map((r: any) => ({
      id: r.id,
      debtorId: r.debtor_id,
      activityType: r.activity_type,
      description: r.description,
      scheduledDate: r.scheduled_date,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
      createdBy: r.created_by
    }));
    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error('API /api/debtors/[id]/activities GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { activityType, description, scheduledDate, createdBy } = await request.json();

    const activityId = crypto.randomUUID();
    const collectorName = createdBy || 'Collector';
    const effectiveDate = scheduledDate || new Date().toISOString().split('T')[0];

    await sql`
      INSERT INTO activities (id, debtor_id, activity_type, description, scheduled_date, created_by, created_at)
      VALUES (${activityId}, ${id}, ${activityType || 'note'}, ${description || ''}, ${effectiveDate}, ${collectorName}, NOW())
    `;

    // Fetch debtor info for audit trail
    try {
      const debtorRows = await sql`SELECT debtor_name, account_number, client_name FROM debtors WHERE id = ${id} LIMIT 1`;
      const debtor = debtorRows[0];
      const debtorLabel = debtor ? `${debtor.debtor_name} (${debtor.account_number})` : id;

      await sql`
        INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
        VALUES (
          ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
          NOW(),
          ${collectorName},
          ${collectorName},
          ${collectorName},
          'collector',
          'log_activity',
          'debtor',
          ${id},
          ${`Debtor: ${debtorLabel}`},
          ${`Action: ${activityType || 'note'} logged on ${effectiveDate}. Note: ${description || 'No additional notes'}`}
        )
      `;
    } catch (auditErr) {
      console.warn('Activity audit log warning:', auditErr);
    }

    return NextResponse.json({ success: true, activityId });
  } catch (error: any) {
    console.error('API /api/debtors/[id]/activities POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

