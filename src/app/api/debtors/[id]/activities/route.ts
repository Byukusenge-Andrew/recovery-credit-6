import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Activity } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await sql`SELECT * FROM activities WHERE debtor_id = ${id} ORDER BY created_at DESC`;
    const activities: Activity[] = rows.map((r: any) => ({
      id: r.id,
      debtorId: r.debtor_id,
      activityType: r.activity_type,
      description: r.description,
      scheduledDate: r.scheduled_date,
      createdAt: r.created_at,
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
    await sql`
      INSERT INTO activities (id, debtor_id, activity_type, description, scheduled_date, created_by, created_at)
      VALUES (${activityId}, ${id}, ${activityType || 'note'}, ${description || ''}, ${scheduledDate || null}, ${createdBy || 'Collector'}, NOW())
    `;

    return NextResponse.json({ success: true, activityId });
  } catch (error: any) {
    console.error('API /api/debtors/[id]/activities POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
