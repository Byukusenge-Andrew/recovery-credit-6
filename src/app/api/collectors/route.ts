import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { sendCollectorWelcomeEmail } from '@/lib/email';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, username, role, full_name, email, is_email_verified, must_change_password, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    const users: User[] = rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      username: String(r.username),
      password: '',
      role: r.role as 'admin' | 'collector',
      fullName: String(r.full_name || ''),
      email: String(r.email || ''),
      isEmailVerified: Boolean(r.is_email_verified),
      mustChangePassword: Boolean(r.must_change_password),
      createdAt: String(r.created_at)
    }));
    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error('API /api/collectors GET error:', error);
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

let globalOtpSequence = 0;

/**
 * Generates a temporary one-time password for new accounts.
 */
async function generateUniqueOneTimePassword(): Promise<string> {
  while (true) {
    const randHex = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
    const seq = (globalOtpSequence++ % 1000).toString().padStart(3, '0');
    const candidate = `RC-${randHex.slice(0, 4)}-${randHex.slice(4, 8)}-${randHex.slice(8, 10)}${seq}`;
    const existing = await sql`SELECT id FROM users WHERE password = ${candidate} LIMIT 1`;
    if (existing.length === 0) {
      return candidate;
    }
  }
}

export async function POST(request: Request) {
  try {
    const { username, fullName, email } = await request.json();

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Automatically generate a unique, non-colliding One-Time Password
    const otpPassword = await generateUniqueOneTimePassword();

    const existing = await sql`
      SELECT id FROM users 
      WHERE LOWER(username) = ${cleanUsername} OR LOWER(email) = ${cleanEmail}
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username or email already exists in system' }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const displayName = fullName?.trim() || cleanUsername;

    // Save with must_change_password = TRUE
    await sql`
      INSERT INTO users (
        id, 
        username, 
        password, 
        role, 
        full_name, 
        email, 
        is_email_verified, 
        must_change_password, 
        temp_password_created_at, 
        created_at
      )
      VALUES (
        ${id}, 
        ${cleanUsername}, 
        ${otpPassword}, 
        'collector', 
        ${displayName}, 
        ${cleanEmail}, 
        TRUE, 
        TRUE, 
        NOW(), 
        NOW()
      )
    `;

    // Dispatch welcome email with One-Time Password
    const emailResult = await sendCollectorWelcomeEmail({
      to: cleanEmail,
      fullName: displayName,
      username: cleanUsername,
      tempPassword: otpPassword
    });

    // Audit log
    const auditSummary = emailResult.success
      ? `Collector account registered for @${cleanUsername}. Welcome email with One-Time Password dispatched to ${cleanEmail}.`
      : `Collector account registered for @${cleanUsername}. Email dispatch note: ${emailResult.error || 'Pending'}.`;

    try {
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
          ${`Collector: ${cleanUsername} (${displayName})`},
          ${auditSummary}
        )
      `;
    } catch (auditErr) {
      console.warn('Collector creation audit log notice:', auditErr);
    }

    return NextResponse.json({
      success: true,
      id,
      username: cleanUsername,
      fullName: displayName,
      email: cleanEmail,
      tempPassword: otpPassword,
      emailSent: emailResult.success,
      emailError: emailResult.error || null
    });
  } catch (error: unknown) {
    console.error('API /api/collectors POST error:', error);
    const err = error as { message?: string };
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
