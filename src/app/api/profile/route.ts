import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { User } from '@/lib/types';

export async function PATCH(request: Request) {
  try {
    const { id, username, fullName, email, currentPassword, newPassword } = await request.json();

    if (!id && !username) {
      return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
    }

    const rows = id 
      ? await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`
      : await sql`SELECT * FROM users WHERE LOWER(username) = ${username.toLowerCase()} LIMIT 1`;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = rows[0];

    // If changing password, verify current password
    if (newPassword) {
      if (user.password !== currentPassword) {
        return NextResponse.json({ error: 'Current password does not match.' }, { status: 400 });
      }
    }

    const updatedFullName = fullName !== undefined ? fullName : user.full_name;
    const updatedEmail = email !== undefined ? email.toLowerCase().trim() : user.email;
    const updatedPassword = newPassword ? newPassword : user.password;

    await sql`
      UPDATE users
      SET full_name = ${updatedFullName}, email = ${updatedEmail}, password = ${updatedPassword}
      WHERE id = ${user.id}
    `;

    const updatedUser: User = {
      id: user.id,
      username: user.username,
      password: '',
      role: user.role,
      fullName: updatedFullName,
      email: updatedEmail,
      isEmailVerified: user.is_email_verified,
      createdAt: user.created_at
    };

    // Audit log
    await sql`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_username, actor_full_name, actor_role, action, target_type, target_id, target_description, details)
      VALUES (
        ${'aud-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8)},
        NOW(),
        ${user.id},
        ${user.username},
        ${updatedFullName},
        ${user.role},
        'update_user',
        'user',
        ${user.id},
        ${`User Profile: ${user.username}`},
        ${`Profile details updated.${newPassword ? ' (Password changed)' : ''}`}
      )
    `;

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('API /api/profile PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
