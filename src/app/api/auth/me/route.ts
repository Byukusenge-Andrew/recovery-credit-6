import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function GET(request: Request) {
  try {
    // 1. Extract token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      token = request.headers.get('x-auth-token') || '';
    }

    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/rc6_auth_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required. No session token found.' }, { status: 401 });
    }

    // 2. Cryptographically verify token
    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session token.' }, { status: 401 });
    }

    // 3. Query user fresh from Neon PostgreSQL
    const rows = await sql`
      SELECT id, username, role, full_name, email, is_email_verified, must_change_password, created_at
      FROM users
      WHERE id = ${payload.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const dbUser = rows[0];
    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      password: '',
      role: dbUser.role,
      fullName: dbUser.full_name,
      email: dbUser.email,
      isEmailVerified: dbUser.is_email_verified,
      mustChangePassword: Boolean(dbUser.must_change_password),
      createdAt: dbUser.created_at
    };

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('API /api/auth/me error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
