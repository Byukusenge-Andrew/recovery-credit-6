'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardStats, getDebtors } from '@/lib/store';
import { CATEGORIES, COLOR_FLAGS, formatCurrency } from '@/lib/constants';
import CategoryBadge from '@/components/CategoryBadge';
import FlagDot from '@/components/FlagDot';
import type { Debtor } from '@/lib/types';
import type { DashboardStats } from '@/lib/store';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDebtors, setRecentDebtors] = useState<Debtor[]>([]);

  useEffect(() => {
    const s = getDashboardStats();
    setStats(s);
    const debtors = getDebtors();
    setRecentDebtors(debtors.slice(-8).reverse());
  }, []);

  return (
    <div className="space-y-6">
      {/* Title + Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here is an overview of your debt recovery portfolio.</p>
        </div>
        <Link
          href="/debtors/add"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm"
        >
          <span>+</span>
          <span>Add Debtor</span>
        </Link>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Debtors</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? stats.totalDebtors : 0}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-3">Active accounts</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Outstanding</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? formatCurrency(stats.totalOutstanding) : 'R 0.00'}</h3>
              <p className="text-xs text-slate-500 font-medium mt-3">Original claims</p>
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
              <p className="text-xs font-medium text-slate-500">Collected Amount</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? formatCurrency(stats.totalPaid) : 'R 0.00'}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-3">Recovered funds</p>
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
              <p className="text-xs text-amber-600 font-medium mt-3">Current exposure</p>
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
              View All Debtors
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
            <h2 className="text-base font-semibold text-slate-900">Priority Flags</h2>
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
          <h2 className="text-base font-semibold text-slate-900">Recent Debtors</h2>
          <Link href="/debtors" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition">
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-medium">Account / Client</th>
                <th className="pb-3 font-medium">Bank</th>
                <th className="pb-3 font-medium text-right">Outstanding</th>
                <th className="pb-3 font-medium text-right">Balance</th>
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
                  <td className="py-3">
                    <p className="font-semibold text-slate-800">{debtor.clientName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{debtor.accountNumber}</p>
                  </td>
                  <td className="py-3 text-slate-600">{debtor.bankName || '—'}</td>
                  <td className="py-3 text-right text-slate-700">{formatCurrency(debtor.outstandingAmount)}</td>
                  <td className="py-3 text-right font-semibold text-slate-900">
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
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-600 text-sm">No debtors yet</p>
                    <p className="text-xs text-slate-400 mt-1">Add a debtor or upload a CSV file to get started.</p>
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
