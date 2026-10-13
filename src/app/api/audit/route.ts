import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { AuditLog } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || 'all';
    const actor = searchParams.get('actor') || 'all';

    let queryText = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (action && action !== 'all') {
      params.push(action);
      queryText += ` AND action = $${params.length}`;
    }

    if (actor && actor !== 'all') {
      params.push(actor.toLowerCase());
      queryText += ` AND LOWER(actor_username) = $${params.length}`;
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      params.push(q);
      const idx = params.length;
      queryText += ` AND (
        LOWER(actor_username) LIKE $${idx} OR 
        LOWER(actor_full_name) LIKE $${idx} OR 
        LOWER(target_description) LIKE $${idx} OR 
        LOWER(details) LIKE $${idx} OR 
        LOWER(action) LIKE $${idx}
      )`;
    }

    queryText += ` ORDER BY timestamp DESC LIMIT 200`;

    const rows = await sql.query(queryText, params);

    const logs: AuditLog[] = (rows as any[]).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      actorId: r.actor_id,
      actorUsername: r.actor_username,
      actorFullName: r.actor_full_name,
      actorRole: r.actor_role,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      targetDescription: r.target_description,
      details: r.details,
      ipAddress: r.ip_address
    }));

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('API /api/audit GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
