import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Notification } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    if (!username) {
      return NextResponse.json({ notifications: [] });
    }

    const rows = await sql`
      SELECT * FROM notifications 
      WHERE LOWER(recipient_username) = ${username.toLowerCase()}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const notifications: Notification[] = rows.map((r: any) => ({
      id: r.id,
      recipientUsername: r.recipient_username,
      title: r.title,
      message: r.message,
      debtorId: r.debtor_id,
      debtorName: r.debtor_name,
      clientName: r.client_name,
      amount: Number(r.amount || 0),
      isRead: r.is_read,
      createdAt: r.created_at
    }));

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.warn('API /api/notifications GET (offline/timeout fallback):', error.message || error);
    // Graceful fallback: return empty notifications array so polling doesn't break the UI
    return NextResponse.json({ notifications: [], isOffline: true });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, username, markAll } = await request.json();

    if (markAll && username) {
      await sql`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE LOWER(recipient_username) = ${username.toLowerCase()}
      `;
    } else if (id) {
      await sql`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/notifications PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
