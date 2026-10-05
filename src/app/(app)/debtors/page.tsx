'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchDebtors, deleteDebtor, exportClientsDebtorsCSV, generateWhatsAppLink, getCurrentUser } from '@/lib/store';
import { CATEGORIES, COLOR_FLAGS, formatCurrency } from '@/lib/constants';
import CategoryBadge from '@/components/CategoryBadge';
import FlagDot from '@/components/FlagDot';
import type { Debtor, Category, ColorFlag, User } from '@/lib/types';

export default function DebtorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || '');
  const [flagFilter, setFlagFilter] = useState<string>(searchParams.get('flag') || '');
  const [clientFilter, setClientFilter] = useState<string>(searchParams.get('client') || '');

  const loadDebtors = useCallback(() => {
    const cat = categoryFilter ? (categoryFilter as Category) : undefined;
    const flag = flagFilter ? (flagFilter as ColorFlag) : undefined;
    const results = searchDebtors(search, cat, flag, clientFilter);
    setDebtors(results);
  }, [search, categoryFilter, flagFilter, clientFilter]);

  useEffect(() => {
    const u = getCurrentUser();
    setCurrentUser(u);
    loadDebtors();
  }, [loadDebtors]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete debtor record for: "${name}"?`)) {
      deleteDebtor(id);
      loadDebtors();
    }
  };

  const handleDownloadClientsDebtors = () => {
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

  const handleWhatsApp = (debtor: Debtor) => {
    const link = generateWhatsAppLink(debtor);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Debtors Portfolio</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bank clients assigned across 12 Recovery Collectors • Signed in as: <span className="font-semibold text-blue-600">{currentUser?.fullName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download Information Button */}
          <button
            onClick={handleDownloadClientsDebtors}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-1.5"
            title="Download full CSV report of all clients and debtors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Download All Data</span>
          </button>

          {/* Upload Button */}
          <Link
            href="/upload"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>Upload Data</span>
          </Link>

          <Link
            href="/debtors/add"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
          >
            + Add Debtor
          </Link>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Search (Debtor, Bank, Account)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, account, ID..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Client (Bank Name)</label>
            <input
              type="text"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              placeholder="Filter by Bank / Client..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-300 transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-300 transition"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Priority Color Flag</label>
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-slate-300 transition"
            >
              <option value="">All Flags</option>
              {COLOR_FLAGS.filter((f) => f.value !== 'none').map((flag) => (
                <option key={flag.value} value={flag.value}>
                  {flag.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-medium">
                <th className="py-3 px-4 font-medium">Client (Bank Name)</th>
                <th className="py-3 px-4 font-medium">Debtor (Bank Client)</th>
                <th className="py-3 px-4 font-medium">Account / ID</th>
                <th className="py-3 px-4 font-medium">Assigned Collector</th>
                <th className="py-3 px-4 font-medium text-right">Outstanding</th>
                <th className="py-3 px-4 font-medium text-right">Paid</th>
                <th className="py-3 px-4 font-medium text-right">Balance Due</th>
                <th className="py-3 px-4 font-medium text-center">Category</th>
                <th className="py-3 px-4 font-medium text-center">Flag</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {debtors.map((debtor) => (
                <tr key={debtor.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                      {debtor.clientName}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <Link href={`/debtors/${debtor.id}`} className="hover:text-blue-600 transition">
                      {debtor.debtorName || (debtor as any).clientName}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    <div>{debtor.accountNumber}</div>
                    <div className="text-[10px] text-slate-400">{debtor.customerId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium">
                      {debtor.assignedCollector || 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(debtor.outstandingAmount)}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(debtor.paidAmount)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${debtor.outstandingBalance > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                    {formatCurrency(debtor.outstandingBalance)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CategoryBadge category={debtor.category} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center"><FlagDot flag={debtor.colorFlag} /></div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/debtors/${debtor.id}`}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="View File"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/debtors/${debtor.id}/edit`}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Edit Record"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </Link>
                      {debtor.whatsappNumber && (
                        <button
                          onClick={() => handleWhatsApp(debtor)}
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition"
                          title="Send WhatsApp Reminder"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                        </button>
                      )}
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(debtor.id, debtor.debtorName)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Record"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {debtors.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-600 text-sm">No debtor records found</p>
                    <p className="text-xs text-slate-400 mt-1">Click &apos;+ Add Debtor&apos; or use &apos;Upload Data&apos; to import debtor files.</p>
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
