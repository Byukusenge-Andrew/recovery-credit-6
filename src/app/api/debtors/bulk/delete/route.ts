import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Bulk delete debtor files (admin only).
// Middleware already rejects non-admins for /api/debtors/bulk*; the role
// header it forwards is checked again here as defence in depth.
const MAX_IDS = 5000;

export async function POST(request: Request) {
  const role = request.headers.get('x-verified-role');
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Administrator privileges required.' }, { status: 403 });
  }
  const actorId = request.headers.get('x-verified-user-id') || 'admin';
  const actorUsername = request.headers.get('x-verified-username') || 'admin';

  let ids: string[];
  try {
    const body = await request.json();
    ids = Array.isArray(body?.ids) ? body.ids.filter((v: unknown): v is string => typeof v === 'string' && v.length > 0) : [];
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  ids = [...new Set(ids)];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'No debtors selected.' }, { status: 400 });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json({ error: `Too many debtors in one request (max ${MAX_IDS}).` }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Same cascade as the single delete: payments, activities, then the file.
    await client.query('DELETE FROM payments WHERE debtor_id = ANY($1)', [ids]);
    await client.query('DELETE FROM activities WHERE debtor_id = ANY($1)', [ids]);
    const deleted = await client.query<{ id: string }>('DELETE FROM debtors WHERE id = ANY($1) RETURNING id', [ids]);
    const count = deleted.rowCount ?? deleted.rows.length;

    const actor = await client.query<{ full_name: string | null }>('SELECT full_name FROM users WHERE id = $1 LIMIT 1', [actorId]);
    await client.query(
      `INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
       VALUES ($1, NOW(), $2, $3, $4, 'admin', 'delete_debtor', 'debtor', NULL, $5, $6)`,
      [
        'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8),
        actorId,
        actorUsername,
        actor.rows[0]?.full_name || 'Administrator',
        `Bulk delete: ${count} debtor file(s)`,
        `Permanently deleted ${count} debtor file(s) with their payments and activity history.`,
      ]
    );
    await client.query('COMMIT');
    return NextResponse.json({ success: true, count });
  } catch (error: unknown) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('API /api/debtors/bulk/delete error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
