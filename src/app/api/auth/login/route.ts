import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';
import type { User } from '@/lib/types';

// In-memory sliding rate limiter for login protection
interface LoginAttempt {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Do a dummy timing-safe comparison to prevent time leaks
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const now = Date.now();

  // 1. Check rate-limit lockout
  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.lockedUntil > now) {
    const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return NextResponse.json(
      { error: `Too many failed login attempts. Account temporarily locked for security. Try again in ${remainingMinutes} minute(s).` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { usernameOrEmail, password } = body;

    // 2. Strict Input Validation
    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/Email and Password are required.' }, { status: 400 });
    }

    if (typeof usernameOrEmail !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid credential format.' }, { status: 400 });
    }

    const input = usernameOrEmail.trim().toLowerCase();
    if (input.length < 2 || input.length > 100 || password.length > 256) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });
    }

    // 3. Query User from Database
    const rows = await sql`
      SELECT id, username, password, role, full_name, email, is_email_verified, must_change_password, created_at
      FROM users
      WHERE LOWER(username) = ${input} OR LOWER(email) = ${input}
      LIMIT 1
    `;

    // 4. Timing-safe password verification
    const isValid = rows.length > 0 && safeCompare(rows[0].password, password);

    if (!isValid) {
      // Record failed attempt
      const current = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= MAX_FAILED_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_DURATION_MS;
      }
      loginAttempts.set(ip, current);

      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });
    }

    // Login successful: reset failed attempt counter
    loginAttempts.delete(ip);

    const dbUser = rows[0];
    const user: User = {
      id: dbUser.id,
      username: dbUser.username,
      password: '', // never expose password
      role: dbUser.role,
      fullName: dbUser.full_name,
      email: dbUser.email,
      isEmailVerified: dbUser.is_email_verified,
      mustChangePassword: Boolean(dbUser.must_change_password),
      createdAt: dbUser.created_at
    };

    // 5. Generate cryptographically signed HMAC-SHA256 session token
    const token = createSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    });

    // 6. Audit log in database
    try {
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
          ${`User @${user.username} authenticated successfully via secure API.`},
          ${ip}
        )
      `;
    } catch (auditErr) {
      console.warn('Audit log write warning:', auditErr);
    }

    const response = NextResponse.json({ success: true, token, user });

    // 7. Set secure httpOnly cookie with strict security flags
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
      : 'Internal server authentication error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
