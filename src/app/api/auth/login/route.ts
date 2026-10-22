import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { usernameOrEmail, password } = await request.json();
    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/Email and Password are required.' }, { status: 400 });
    }

    const input = usernameOrEmail.trim().toLowerCase();
    const rows = await sql`
      SELECT id, username, password, role, full_name, email, is_email_verified, must_change_password, created_at
      FROM users
      WHERE LOWER(username) = ${input} OR LOWER(email) = ${input}
      LIMIT 1
    `;

    if (rows.length === 0 || rows[0].password !== password) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });
    }

    const dbUser = rows[0];
    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      password: '', // never expose password hash/plain to client
      role: dbUser.role,
      fullName: dbUser.full_name,
      email: dbUser.email,
      isEmailVerified: dbUser.is_email_verified,
      mustChangePassword: Boolean(dbUser.must_change_password),
      createdAt: dbUser.created_at
    };

    // Generate signed HMAC session token
    const token = createSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    });

    // Log login audit directly to Neon PostgreSQL
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details, ip_address)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${user.id},
        ${user.username},
        ${user.fullName},
        ${user.role},
        'login',
        'user',
        ${user.id},
        ${`User: ${user.username} (${user.role})`},
        ${`User @${user.username} authenticated successfully via web portal.`},
        ${ip}
      )
    `;

    const response = NextResponse.json({ success: true, token, user });

    // Set secure httpOnly cookie (browser cannot read this via JavaScript, preventing XSS leaks)
    response.cookies.set({
      name: 'rc6_auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error: unknown) {
    console.error('API /api/auth/login error:', error);
    const err = error as { message?: string; cause?: { code?: string } };
    const isTimeout = err?.message?.includes('fetch failed') || err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
    const msg = isTimeout
      ? 'Database connection timed out. Please verify your internet connection and try again.'
      : (err?.message || 'Internal server error');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
