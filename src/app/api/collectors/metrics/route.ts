import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { CollectorPerformance, AgencyCollectorDashboardSummary } from '@/lib/types';

export async function GET() {
  try {
    // 1. Fetch all collector users
    const users = await sql`
      SELECT id, username, full_name, email, role, created_at
      FROM users
      WHERE role = 'collector'
      ORDER BY full_name ASC
    `;

    // 2. Fetch debtor stats per collector
    const debtorStatsRows = await sql`
      SELECT 
        LOWER(assigned_collector) AS collector_key,
        COUNT(*)::int AS assigned_count,
        COALESCE(SUM(outstanding_amount), 0)::numeric AS total_outstanding,
        COALESCE(SUM(paid_amount), 0)::numeric AS total_paid,
        COALESCE(SUM(outstanding_balance), 0)::numeric AS total_balance
      FROM debtors
      WHERE assigned_collector IS NOT NULL AND TRIM(assigned_collector) != ''
      GROUP BY LOWER(assigned_collector)
    `;

    // 3. Fetch uncontacted debtors count per collector (assigned to collector, but has 0 records in activities)
    const uncontactedStatsRows = await sql`
      SELECT 
        LOWER(d.assigned_collector) AS collector_key,
        COUNT(d.id)::int AS uncontacted_count
      FROM debtors d
      WHERE d.assigned_collector IS NOT NULL 
        AND TRIM(d.assigned_collector) != ''
        AND NOT EXISTS (
          SELECT 1 FROM activities a WHERE a.debtor_id = d.id
        )
      GROUP BY LOWER(d.assigned_collector)
    `;

    // 4. Fetch activity statistics per collector
    const activityStatsRows = await sql`
      SELECT 
        LOWER(created_by) AS collector_key,
        COUNT(*)::int AS total_interactions,
        COUNT(*) FILTER (WHERE activity_type = 'call_made')::int AS calls_made,
        COUNT(*) FILTER (WHERE activity_type = 'meeting_scheduled')::int AS meetings_scheduled,
        COUNT(*) FILTER (WHERE activity_type = 'note')::int AS notes_logged,
        MAX(created_at) AS last_active_at
      FROM activities
      WHERE created_by IS NOT NULL AND TRIM(created_by) != ''
      GROUP BY LOWER(created_by)
    `;

    // 5. Unassigned portfolio metrics
    const unassignedRows = await sql`
      SELECT 
        COUNT(*)::int AS unassigned_count,
        COALESCE(SUM(outstanding_balance), 0)::numeric AS unassigned_balance,
        COUNT(*) FILTER (
          WHERE NOT EXISTS (SELECT 1 FROM activities a WHERE a.debtor_id = debtors.id)
        )::int AS unassigned_uncontacted
      FROM debtors
      WHERE assigned_collector IS NULL OR TRIM(assigned_collector) = ''
    `;

    const unassignedData = unassignedRows[0] || {
      unassigned_count: 0,
      unassigned_balance: 0,
      unassigned_uncontacted: 0
    };

    // Helper map lookup
    const debtorStatsMap = new Map<string, any>();
    debtorStatsRows.forEach((r: any) => {
      debtorStatsMap.set(r.collector_key.toLowerCase(), r);
    });

    const uncontactedMap = new Map<string, number>();
    uncontactedStatsRows.forEach((r: any) => {
      uncontactedMap.set(r.collector_key.toLowerCase(), Number(r.uncontacted_count) || 0);
    });

    const activityStatsMap = new Map<string, any>();
    activityStatsRows.forEach((r: any) => {
      activityStatsMap.set(r.collector_key.toLowerCase(), r);
    });

    // 6. Assemble metrics for each collector
    const collectors: CollectorPerformance[] = users.map((u: any) => {
      const usernameKey = (u.username || '').toLowerCase();
      const fullNameKey = (u.full_name || '').toLowerCase();

      // Check username match first, then full_name
      const dStats = debtorStatsMap.get(usernameKey) || debtorStatsMap.get(fullNameKey) || {
        assigned_count: 0,
        total_outstanding: 0,
        total_paid: 0,
        total_balance: 0
      };

      const uncontactedCount = uncontactedMap.get(usernameKey) ?? uncontactedMap.get(fullNameKey) ?? 0;

      const aStats = activityStatsMap.get(usernameKey) || activityStatsMap.get(fullNameKey) || {
        total_interactions: 0,
        calls_made: 0,
        meetings_scheduled: 0,
        notes_logged: 0,
        last_active_at: null
      };

      const totalOutstanding = Number(dStats.total_outstanding) || 0;
      const totalPaid = Number(dStats.total_paid) || 0;
      const remainingBalance = Number(dStats.total_balance) || 0;
      const assignedCount = Number(dStats.assigned_count) || 0;
      const totalInteractions = Number(aStats.total_interactions) || 0;

      const recoveryRate = totalOutstanding > 0 ? Math.round((totalPaid / totalOutstanding) * 100) : 0;

      // Classify status:
      // Inactive: 0 interactions or (assigned files > 0 and 0 interactions)
      // Needs attention: has more than 50% uncontacted files or very low interactions
      // Top performer: good recovery rate (> 40%) and active interactions
      // Active: normal working collector
      let activityStatus: 'top_performer' | 'active' | 'needs_attention' | 'inactive' = 'active';
      if (totalInteractions === 0) {
        activityStatus = 'inactive';
      } else if (assignedCount > 0 && (uncontactedCount / assignedCount >= 0.5 || totalInteractions < 3)) {
        activityStatus = 'needs_attention';
      } else if (recoveryRate >= 35 && totalInteractions >= 5) {
        activityStatus = 'top_performer';
      }

      return {
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : '',
        assignedDebtorsCount: assignedCount,
        totalOutstanding,
        totalPaid,
        remainingBalance,
        recoveryRate,
        uncontactedCount,
        totalInteractions,
        callsMade: Number(aStats.calls_made) || 0,
        meetingsScheduled: Number(aStats.meetings_scheduled) || 0,
        notesLogged: Number(aStats.notes_logged) || 0,
        lastActiveAt: aStats.last_active_at ? new Date(aStats.last_active_at).toISOString() : null,
        activityStatus
      };
    });

    // 7. Calculate Agency Collector Dashboard Summary
    const totalCollectors = collectors.length;
    const activeCollectors = collectors.filter(c => c.totalInteractions > 0).length;
    const inactiveCollectors = collectors.filter(c => c.totalInteractions === 0).length;
    const totalAssignedDebtors = collectors.reduce((acc, c) => acc + c.assignedDebtorsCount, 0);
    const totalAssignedClaim = collectors.reduce((acc, c) => acc + c.totalOutstanding, 0);
    const totalAssignedPaid = collectors.reduce((acc, c) => acc + c.totalPaid, 0);
    const totalRemainingBalance = collectors.reduce((acc, c) => acc + c.remainingBalance, 0);
    const overallRecoveryRate = totalAssignedClaim > 0 ? Math.round((totalAssignedPaid / totalAssignedClaim) * 100) : 0;
    const totalInteractions = collectors.reduce((acc, c) => acc + c.totalInteractions, 0);
    const totalUncontactedDebtors = collectors.reduce((acc, c) => acc + c.uncontactedCount, 0);

    const summary: AgencyCollectorDashboardSummary = {
      totalCollectors,
      activeCollectors,
      inactiveCollectors,
      totalAssignedDebtors,
      totalAssignedClaim,
      totalAssignedPaid,
      totalRemainingBalance,
      overallRecoveryRate,
      totalInteractions,
      totalUncontactedDebtors,
      unassignedDebtorsCount: Number(unassignedData.unassigned_count) || 0,
      unassignedBalance: Number(unassignedData.unassigned_balance) || 0
    };

    return NextResponse.json({ collectors, summary });
  } catch (error: any) {
    console.error('API /api/collectors/metrics GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
