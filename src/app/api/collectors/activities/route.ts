import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EnrichedActivity, ActivitySummary } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collector = searchParams.get('collector');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const activityType = searchParams.get('activityType') || searchParams.get('type');
    const search = searchParams.get('search');

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramIdx = 1;

    if (collector && collector !== 'all') {
      conditions.push(`(LOWER(a.created_by) = $${paramIdx} OR LOWER(u.username) = $${paramIdx} OR LOWER(u.full_name) = $${paramIdx})`);
      values.push(collector.toLowerCase().trim());
      paramIdx++;
    }

    if (date && date.trim()) {
      conditions.push(`(a.scheduled_date = $${paramIdx} OR TO_CHAR(a.created_at, 'YYYY-MM-DD') = $${paramIdx})`);
      values.push(date.trim());
      paramIdx++;
    } else {
      if (startDate && startDate.trim()) {
        conditions.push(`(a.scheduled_date >= $${paramIdx} OR TO_CHAR(a.created_at, 'YYYY-MM-DD') >= $${paramIdx})`);
        values.push(startDate.trim());
        paramIdx++;
      }
      if (endDate && endDate.trim()) {
        conditions.push(`(a.scheduled_date <= $${paramIdx} OR TO_CHAR(a.created_at, 'YYYY-MM-DD') <= $${paramIdx})`);
        values.push(endDate.trim());
        paramIdx++;
      }
    }

    if (activityType && activityType !== 'all') {
      conditions.push(`a.activity_type = $${paramIdx}`);
      values.push(activityType.trim());
      paramIdx++;
    }

    if (search && search.trim()) {
      conditions.push(`(
        d.debtor_name ILIKE $${paramIdx} OR 
        d.account_number ILIKE $${paramIdx} OR 
        d.bank_name ILIKE $${paramIdx} OR 
        d.client_name ILIKE $${paramIdx} OR 
        a.description ILIKE $${paramIdx}
      )`);
      values.push(`%${search.trim()}%`);
      paramIdx++;
    }

    const queryText = `
      SELECT 
        a.id,
        a.debtor_id AS "debtorId",
        a.activity_type AS "activityType",
        a.description,
        a.scheduled_date AS "scheduledDate",
        a.created_by AS "createdBy",
        a.created_at AS "createdAt",
        d.debtor_name AS "debtorName",
        d.account_number AS "accountNumber",
        d.client_name AS "clientName",
        d.bank_name AS "bankName",
        d.customer_id AS "customerId",
        COALESCE(u.full_name, a.created_by) AS "collectorFullName"
      FROM activities a
      JOIN debtors d ON a.debtor_id = d.id
      LEFT JOIN users u ON LOWER(a.created_by) = LOWER(u.username) OR a.created_by = u.full_name
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.created_at DESC
      LIMIT 500
    `;

    const rows = await sql.query(queryText, values);

    const activities: EnrichedActivity[] = rows.map((r: any) => ({
      id: r.id,
      debtorId: r.debtorId,
      activityType: r.activityType,
      description: r.description || '',
      scheduledDate: r.scheduledDate || '',
      createdBy: r.createdBy || '',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
      debtorName: r.debtorName || '',
      accountNumber: r.accountNumber || '',
      clientName: r.clientName || '',
      bankName: r.bankName || r.clientName || '',
      customerId: r.customerId || '',
      collectorFullName: r.collectorFullName || r.createdBy || ''
    }));

    let callsMade = 0;
    let meetingsScheduled = 0;
    let notesLogged = 0;
    const debtorSet = new Set<string>();

    for (const act of activities) {
      if (act.activityType === 'call_made') callsMade++;
      else if (act.activityType === 'meeting_scheduled') meetingsScheduled++;
      else if (act.activityType === 'note') notesLogged++;
      if (act.debtorId) debtorSet.add(act.debtorId);
    }

    const summary: ActivitySummary = {
      totalActivities: activities.length,
      callsMade,
      meetingsScheduled,
      notesLogged,
      debtorsReached: debtorSet.size
    };

    return NextResponse.json({ activities, summary });
  } catch (error: any) {
    console.error('API /api/collectors/activities GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
