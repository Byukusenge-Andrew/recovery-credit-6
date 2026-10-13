import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, username, role, full_name, email, is_email_verified, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    const users: User[] = rows.map((r: any) => ({
      id: r.id,
      username: r.username,
      password: '',
      role: r.role,
      fullName: r.full_name,
      email: r.email,
      isEmailVerified: r.is_email_verified,
      createdAt: r.created_at
    }));
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('API /api/collectors GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, fullName, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existing = await sql`
      SELECT id FROM users 
      WHERE LOWER(username) = ${cleanUsername} OR LOWER(email) = ${cleanEmail}
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    const id = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, username, password, role, full_name, email, is_email_verified, created_at)
      VALUES (${id}, ${cleanUsername}, ${password}, 'collector', ${fullName || cleanUsername}, ${cleanEmail}, TRUE, NOW())
    `;

    // Audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        'admin',
        'admin',
        'Administrator',
        'admin',
        'add_collector',
        'user',
        ${id},
        ${`Collector: ${cleanUsername} (${fullName})`},
        ${`Created new collector account '${cleanUsername}' in Neon PostgreSQL.`}
      )
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API /api/collectors POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
