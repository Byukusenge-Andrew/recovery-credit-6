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
    const users: User[] = rows.map((r: any) => ({
      id: r.id,
      username: r.username,
      password: '',
      role: r.role,
      fullName: r.full_name,
      email: r.email,
      isEmailVerified: r.is_email_verified,
      mustChangePassword: Boolean(r.must_change_password),
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

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Generate secure One-Time Password if not provided or format clean temporary OTP
    const otpPassword = password && password.trim().length >= 6
      ? password.trim()
      : 'RC-' + crypto.randomBytes(4).toString('hex').toUpperCase();

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
  } catch (error: any) {
    console.error('API /api/collectors POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
