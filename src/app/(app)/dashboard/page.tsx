'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardStats, getDebtors, getCurrentUser, exportClientsDebtorsCSV } from '@/lib/store';
import { CATEGORIES, COLOR_FLAGS, formatCurrency } from '@/lib/constants';
import CategoryBadge from '@/components/CategoryBadge';
import FlagDot from '@/components/FlagDot';
import type { Debtor, User } from '@/lib/types';
import type { DashboardStats } from '@/lib/store';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDebtors, setRecentDebtors] = useState<Debtor[]>([]);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const s = getDashboardStats();
    setStats(s);
    const debtors = getDebtors();
    setRecentDebtors(debtors.slice(-8).reverse());
  }, []);

  const handleDownloadAll = () => {
    const csv = exportClientsDebtorsCSV();
    if (!csv) {
      alert('No data available to download.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clients_debtors_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title + Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              {currentUser?.role === 'admin' ? 'Tony G (Admin)' : `${currentUser?.fullName} (Collector)`}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of portfolios for <strong>Clients (Banks)</strong> and their assigned <strong>Debtors</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Download Button */}
          <button
            onClick={handleDownloadAll}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
            title="Download CSV report of all clients and debtors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Download All Data</span>
          </button>

          {/* Upload Button */}
          <Link
            href="/upload"
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>Upload CSV</span>
          </Link>

          <Link
            href="/debtors/add"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm"
          >
            <span>+</span>
            <span>Add Debtor</span>
          </Link>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Debtors (Bank Clients)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? stats.totalDebtors : 0}</h3>
              <p className="text-xs text-blue-600 font-medium mt-3">
                Clients (Banks): <strong>{stats ? stats.clientsCount : 0}</strong>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              12 C
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Outstanding Amount</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? formatCurrency(stats.totalOutstanding) : 'R 0.00'}</h3>
              <p className="text-xs text-slate-500 font-medium mt-3">Total book claims</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Recovered (Paid)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? formatCurrency(stats.totalPaid) : 'R 0.00'}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-3">Funds successfully collected</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Net Due Balance</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? formatCurrency(stats.totalBalance) : 'R 0.00'}</h3>
              <p className="text-xs text-amber-600 font-medium mt-3">Remaining open exposure</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Categories & Priority Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Recovery Categories</h2>
            <Link href="/debtors" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition">
              View All Debtors →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const count = stats?.categoryCounts?.[cat.value] || 0;
              return (
                <div
                  key={cat.value}
                  onClick={() => router.push(`/debtors?category=${cat.value}`)}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cat.bgLight, color: cat.color }}>
                      {count}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 truncate">{cat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Priority Color Flags</h2>
          </div>

          <div className="space-y-3">
            {COLOR_FLAGS.filter((f) => f.value !== 'none').map((flag) => {
              const count = stats?.flagCounts?.[flag.value] || 0;
              return (
                <div
                  key={flag.value}
                  onClick={() => router.push(`/debtors?flag=${flag.value}`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <FlagDot flag={flag.value} />
                    <span className="text-xs font-medium text-slate-700 capitalize">{flag.label} Flag</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Debtors Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Recently Added Debtors</h2>
          <Link href="/debtors" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition">
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-medium">Client (Bank)</th>
                <th className="pb-3 font-medium">Debtor (Bank Client)</th>
                <th className="pb-3 font-medium">Assigned Collector</th>
                <th className="pb-3 font-medium text-right">Outstanding</th>
                <th className="pb-3 font-medium text-right">Balance Due</th>
                <th className="pb-3 font-medium text-center">Category</th>
                <th className="pb-3 font-medium text-center">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentDebtors.map((debtor) => (
                <tr
                  key={debtor.id}
                  onClick={() => router.push(`/debtors/${debtor.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="py-3 font-semibold text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">{debtor.clientName}</span>
                  </td>
                  <td className="py-3">
                    <p className="font-semibold text-slate-900">{debtor.debtorName || (debtor as any).clientName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{debtor.accountNumber}</p>
                  </td>
                  <td className="py-3 text-slate-600">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                      {debtor.assignedCollector || 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-700">{formatCurrency(debtor.outstandingAmount)}</td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {formatCurrency(debtor.outstandingBalance)}
                  </td>
                  <td className="py-3 text-center">
                    <CategoryBadge category={debtor.category} />
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex justify-center"><FlagDot flag={debtor.colorFlag} /></div>
                  </td>
                </tr>
              ))}
              {recentDebtors.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-600 text-sm">No debtor files found</p>
                    <p className="text-xs text-slate-400 mt-1">Click &apos;Add Debtor&apos; or use &apos;Upload CSV&apos; to get started.</p>
                    <Link
                      href="/debtors/add"
                      className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                    >
                      Add Debtor
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
