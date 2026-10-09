'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardStats, getDebtors, getCurrentUser, exportClientsDebtorsCSV, getNotifications } from '@/lib/store';
import { CATEGORIES, COLOR_FLAGS, formatCurrency } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import CategoryBadge from '@/components/CategoryBadge';
import FlagDot from '@/components/FlagDot';
import type { Debtor, User, Notification } from '@/lib/types';
import type { DashboardStats } from '@/lib/store';

export default function DashboardPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDebtors, setRecentDebtors] = useState<Debtor[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  useEffect(() => {
    setIsClientLoaded(true);
    const user = getCurrentUser();
    setCurrentUser(user);
    const s = getDashboardStats();
    setStats(s);
    const debtors = getDebtors();
    setRecentDebtors(debtors.slice(-8).reverse());

    if (user) {
      const notes = getNotifications(user.username);
      setRecentNotifications(notes.slice(0, 3));
    }
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

  const isCollector = isClientLoaded && currentUser?.role === 'collector';
  const displayName = isClientLoaded
    ? currentUser?.fullName || currentUser?.username || 'User'
    : 'User';

  const roleBadge = isCollector
    ? `${displayName} (${t('role_collector')})`
    : `${displayName} (${t('role_admin')})`;

  const recoveryRate = stats && stats.totalOutstanding > 0
    ? Math.min(100, Math.round((stats.totalPaid / stats.totalOutstanding) * 100))
    : 0;

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Title + Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isCollector ? t('dash_title_collector') : t('dash_title_admin')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              {roleBadge}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {isCollector ? (
              t('dash_subtitle_collector')
            ) : (
              t('dash_subtitle_admin')
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Button */}
          <button
            onClick={handleDownloadAll}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
            title={isCollector ? t('dash_btn_download_my') : t('dash_btn_download_all')}
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>{isCollector ? t('dash_btn_download_my') : t('dash_btn_download_all')}</span>
          </button>

          {/* Admin-only Upload & Add Buttons */}
          {!isCollector && (
            <>
              <Link
                href="/upload"
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span>{t('dash_btn_upload')}</span>
              </Link>

              <Link
                href="/debtors/add"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm"
              >
                <span>+</span>
                <span>{t('dash_btn_add')}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Collector Real-Time Assignment Alert Banner (if any recent notifications) */}
      {recentNotifications.length > 0 && !recentNotifications[0].isRead && (
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900">{recentNotifications[0].title}</p>
              <p className="text-xs text-blue-700 mt-0.5">{recentNotifications[0].message}</p>
              {recentNotifications[0].debtorId && (
                <Link
                  href={`/debtors/${recentNotifications[0].debtorId}`}
                  className="inline-block mt-1 text-[11px] font-bold text-blue-800 underline hover:text-blue-900"
                >
                  Open assigned debtor file →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recovery Performance Card with clean white background & light blue styling */}
      {stats && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                  {isCollector ? t('dash_target_banner_collector') : t('dash_target_banner_admin')}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {stats.totalDebtors} {isCollector ? t('dash_assigned_accounts') : t('dash_active_files')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                {isCollector ? t('dash_recovery_rate') : t('dash_agency_recovery')}
                <span className="text-blue-600">{recoveryRate}%</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">{formatCurrency(stats.totalPaid)}</span> {t('dash_recovered_out_of')}{' '}
                <span className="font-semibold text-slate-700">{formatCurrency(stats.totalOutstanding)}</span> {t('dash_total_claim_exposure')}
              </p>
            </div>
            <div className="sm:text-right shrink-0 bg-slate-50/70 rounded-xl p-3 border border-slate-100 sm:min-w-[180px]">
              <span className="text-[11px] font-medium text-slate-400 block">{t('dash_remaining_due_balance')}</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(stats.totalBalance)}</p>
              <span className="text-[10px] text-blue-600 font-medium">{100 - recoveryRate}% {t('dash_remaining')}</span>
            </div>
          </div>

          {/* Progress Bar with Light Blue styling */}
          <div className="w-full bg-blue-50/80 border border-blue-100/70 rounded-full h-3 mt-4 overflow-hidden p-0.5">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${recoveryRate}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {isCollector ? t('dash_card_my_debtors') : t('dash_card_total_debtors')}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? stats.totalDebtors : 0}</h3>
              <p className="text-xs text-blue-600 font-medium mt-3">
                {isCollector ? t('dash_card_clients_queue') : t('dash_card_clients')} <strong>{stats ? stats.clientsCount : 0}</strong>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {isCollector ? t('dash_card_my_outstanding') : t('dash_card_outstanding')}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? formatCurrency(stats.totalOutstanding) : 'R 0.00'}</h3>
              <p className="text-xs text-slate-500 font-medium mt-3">
                {isCollector ? t('dash_card_cases_mgmt') : t('dash_card_book_claims')}
              </p>
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
              <p className="text-xs font-medium text-slate-500">
                {isCollector ? t('dash_card_my_recovered') : t('dash_card_recovered')}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? formatCurrency(stats.totalPaid) : 'R 0.00'}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-3">
                {isCollector ? t('dash_card_my_recovered_sub') : t('dash_card_recovered_sub')}
              </p>
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
              <p className="text-xs font-medium text-slate-500">
                {isCollector ? t('dash_card_my_balance') : t('dash_card_balance')}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats ? formatCurrency(stats.totalBalance) : 'R 0.00'}</h3>
              <p className="text-xs text-amber-600 font-medium mt-3">{t('dash_card_open_exposure')}</p>
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
            <h2 className="text-base font-semibold text-slate-900">
              {isCollector ? t('dash_my_categories_title') : t('dash_categories_title')}
            </h2>
            <Link href="/debtors" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition">
              {isCollector ? t('dash_view_my_debtors') : t('dash_view_all_debtors')}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const count = stats?.categoryCounts?.[cat.value] || 0;
              const catTranslated = t(`cat_${cat.value}` as any) || cat.label;
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
                  <p className="text-xs font-medium text-slate-700 truncate">{catTranslated}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">{t('dash_flags_title')}</h2>
          </div>

          <div className="space-y-3">
            {COLOR_FLAGS.filter((f) => f.value !== 'none').map((flag) => {
              const count = stats?.flagCounts?.[flag.value] || 0;
              const flagTranslated = t(`flag_${flag.value}` as any) || `${flag.label} Flag`;
              return (
                <div
                  key={flag.value}
                  onClick={() => router.push(`/debtors?flag=${flag.value}`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <FlagDot flag={flag.value} />
                    <span className="text-xs font-medium text-slate-700 capitalize">{flagTranslated}</span>
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
          <h2 className="text-base font-semibold text-slate-900">
            {isCollector ? t('dash_my_recent_debtors') : t('dash_recent_debtors')}
          </h2>
          <Link href="/debtors" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition">
            {t('dash_view_all')}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-medium">{t('dash_col_client')}</th>
                <th className="pb-3 font-medium">{t('dash_col_debtor')}</th>
                {!isCollector && <th className="pb-3 font-medium">{t('dash_col_collector')}</th>}
                <th className="pb-3 font-medium text-right">{t('dash_col_outstanding')}</th>
                <th className="pb-3 font-medium text-right">{t('dash_col_balance')}</th>
                <th className="pb-3 font-medium text-center">{t('dash_col_category')}</th>
                <th className="pb-3 font-medium text-center">{t('dash_col_flag')}</th>
                {isCollector && <th className="pb-3 font-medium text-right">{t('dash_col_action')}</th>}
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
                  {!isCollector && (
                    <td className="py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                        {debtor.assignedCollector || 'Unassigned'}
                      </span>
                    </td>
                  )}
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
                  {isCollector && (
                    <td className="py-3 text-right">
                      <span className="text-[11px] font-semibold text-blue-600 hover:text-blue-800">
                        {t('dash_open_file')}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
              {recentDebtors.length === 0 && (
                <tr>
                  <td colSpan={isCollector ? 7 : 7} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-600 text-sm">
                      {isCollector ? t('dash_empty_title_collector') : t('dash_empty_title_admin')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isCollector
                        ? t('dash_empty_desc_collector')
                        : t('dash_empty_desc_admin')}
                    </p>
                    {!isCollector && (
                      <Link
                        href="/debtors/add"
                        className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                      >
                        {t('dash_btn_add')}
                      </Link>
                    )}
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
