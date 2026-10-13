import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { DashboardStats, Category, ColorFlag } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'admin';
    const username = searchParams.get('username') || '';

    let debtorsRows: any[];
    if (role === 'collector' && username) {
      debtorsRows = await sql`
        SELECT outstanding_amount, paid_amount, outstanding_balance, client_name, category, color_flag
        FROM debtors
        WHERE LOWER(assigned_collector) = ${username.toLowerCase()}
      `;
    } else {
      debtorsRows = await sql`
        SELECT outstanding_amount, paid_amount, outstanding_balance, client_name, category, color_flag
        FROM debtors
      `;
    }

    const uniqueClients = new Set(debtorsRows.map(d => d.client_name).filter(Boolean));

    const stats = {
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
      } as Record<Category, number>,
      flagCounts: {
        none: 0,
        red: 0,
        blue: 0,
        yellow: 0,
        green: 0
      } as Record<ColorFlag, number>
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
  } catch (error: any) {
    console.error('API /api/dashboard/stats GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
