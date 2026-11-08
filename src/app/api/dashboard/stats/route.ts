import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { DashboardStats, Category, ColorFlag } from '@/lib/types';

interface DebtorRow {
  outstanding_amount: number | string | null;
  paid_amount: number | string | null;
  outstanding_balance: number | string | null;
  client_name: string | null;
  category: Category | string | null;
  color_flag: ColorFlag | string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const verifiedRole = request.headers.get('x-verified-role');
    const verifiedUsername = request.headers.get('x-verified-username');

    // Role-based access enforcement: Collectors can NEVER escalate to view agency-wide stats
    const isCollector = verifiedRole === 'collector';
    const effectiveRole = isCollector ? 'collector' : (searchParams.get('role') || verifiedRole || 'admin');
    const effectiveUsername = isCollector
      ? (verifiedUsername || '')
      : (searchParams.get('username') || verifiedUsername || '');

    let debtorsRows: DebtorRow[];
    if (effectiveRole === 'collector') {
      const collectorUser = (effectiveUsername || searchParams.get('username') || '').trim().toLowerCase();
      if (!collectorUser) {
        debtorsRows = [];
      } else {
        let allowedNames = [collectorUser];
        try {
          const u = await sql`SELECT username, full_name FROM users WHERE LOWER(username) = ${collectorUser} LIMIT 1`;
          if (u.length > 0) {
            if (u[0].username) allowedNames.push(String(u[0].username).trim().toLowerCase());
            if (u[0].full_name) allowedNames.push(String(u[0].full_name).trim().toLowerCase());
          }
        } catch (_) {}
        const uniqueNames = Array.from(new Set(allowedNames.filter(Boolean)));
        const rows = await sql`
          SELECT outstanding_amount, paid_amount, outstanding_balance, client_name, category, color_flag
          FROM debtors
          WHERE LOWER(assigned_collector) = ANY(${uniqueNames})
        `;
        debtorsRows = rows as unknown as DebtorRow[];
      }
    } else {
      const rows = await sql`
        SELECT outstanding_amount, paid_amount, outstanding_balance, client_name, category, color_flag
        FROM debtors
      `;
      debtorsRows = rows as unknown as DebtorRow[];
    }

    const uniqueClients = new Set(debtorsRows.map(d => d.client_name).filter(Boolean));

    const stats: DashboardStats = {
      totalDebtors: debtorsRows.length,
      totalOutstanding: 0,
      totalPaid: 0,
      totalBalance: 0,
      outstandingBalance: 0,
      clientsCount: uniqueClients.size,
      categoryCounts: {
        completed: 0,
        paying: 0,
        promise_to_pay: 0,
        schedule_meeting: 0,
        waiver_letter: 0,
        disputed: 0,
        negotiation: 0,
        skip_tracing: 0
      },
      flagCounts: {
        none: 0,
        red: 0,
        blue: 0,
        yellow: 0,
        green: 0
      }
    };

    debtorsRows.forEach(d => {
      stats.totalOutstanding += Number(d.outstanding_amount || 0);
      stats.totalPaid += Number(d.paid_amount || 0);
      stats.totalBalance += Number(d.outstanding_balance || 0);

      const cat = d.category as Category;
      if (cat && cat in stats.categoryCounts) {
        stats.categoryCounts[cat]++;
      }

      const fl = d.color_flag as ColorFlag;
      if (fl && fl in stats.flagCounts) {
        stats.flagCounts[fl]++;
      }
    });

    stats.outstandingBalance = stats.totalBalance;

    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error('API /api/dashboard/stats GET error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
