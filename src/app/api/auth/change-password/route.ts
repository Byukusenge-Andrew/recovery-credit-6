import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifySessionToken, createSessionToken } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    // 1. Authenticate session token
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
      return NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 });
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    // 2. Parse request body
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'New password and confirmation are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match. Please re-enter.' }, { status: 400 });
    }

    // 3. Query existing user
    const rows = await sql`
      SELECT id, username, password, role, full_name, email, is_email_verified, must_change_password
      FROM users
      WHERE id = ${payload.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const dbUser = rows[0];

    // 4. If currentPassword supplied, verify it
    if (currentPassword && dbUser.password !== currentPassword) {
      return NextResponse.json({ error: 'Current one-time password is incorrect.' }, { status: 400 });
    }

    if (newPassword === dbUser.password) {
      return NextResponse.json({ error: 'New password cannot be the same as your temporary password.' }, { status: 400 });
    }

    // 5. Update user password and clear must_change_password flag
    await sql`
      UPDATE users 
      SET 
        password = ${newPassword}, 
        must_change_password = FALSE, 
        temp_password_created_at = NULL 
      WHERE id = ${dbUser.id}
    `;

    const updatedUser: User = {
      id: dbUser.id,
      username: dbUser.username,
      password: '',
      role: dbUser.role,
      fullName: dbUser.full_name,
      email: dbUser.email,
      isEmailVerified: dbUser.is_email_verified,
      mustChangePassword: false,
      createdAt: new Date().toISOString()
    };

    // 6. Generate fresh session token
    const newToken = createSessionToken({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      mustChangePassword: false
    });

    // 7. Audit log
    try {
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await sql`
        INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details, ip_address)
        VALUES (
          ${'aud-pw-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
          NOW(),
          ${updatedUser.id},
          ${updatedUser.username},
          ${updatedUser.fullName},
          ${updatedUser.role},
          'update_user',
          'user',
          ${updatedUser.id},
          ${`User: ${updatedUser.username}`},
          ${`Collector @${updatedUser.username} successfully upgraded temporary OTP to permanent password.`},
          ${ip}
        )
      `;
    } catch (auditErr) {
      console.warn('Change password audit log notice:', auditErr);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Password successfully updated!',
      user: updatedUser,
      token: newToken
    });

    // 8. Update cookie
    response.cookies.set({
      name: 'rc6_auth_token',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    console.error('API /api/auth/change-password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
