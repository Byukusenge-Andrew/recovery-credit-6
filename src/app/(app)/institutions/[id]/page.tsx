'use client';

import { useState, useEffect, useCallback, useRef, use, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, importClientsDebtorsFromCSV, generateWhatsAppLink } from '@/lib/store';
import { institutionsApi, debtorsApi } from '@/services/api';
import { CATEGORIES, COLOR_FLAGS, formatCurrency } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import CategoryBadge from '@/components/CategoryBadge';
import FlagDot from '@/components/FlagDot';
import type { FinancialInstitution, Debtor } from '@/lib/types';

interface InstitutionMetrics {
  totalDebtors: number;
  totalOutstanding: number;
  totalPaid: number;
  totalBalance: number;
  recoveryRate: number;
  assignedCollectors: string[];
  categoryBreakdown: Record<string, number>;
  flagBreakdown: Record<string, number>;
}

const emptySubscribe = () => () => {};

export default function InstitutionDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isClientLoaded = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const currentUser = isClientLoaded ? getCurrentUser() : null;
  const [institution, setInstitution] = useState<FinancialInstitution | null>(null);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [metrics, setMetrics] = useState<InstitutionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [flagFilter, setFlagFilter] = useState('none');
  const [collectorFilter, setCollectorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  // Bulk Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  // Edit Institution Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState<'commercial_bank' | 'microfinance' | 'credit_union' | 'fintech' | 'other'>('commercial_bank');
  const [editContact, setEditContact] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const loadData = useCallback(() => {
    const user = getCurrentUser();
    institutionsApi.getById(id, {
      search,
      category: categoryFilter,
      flag: flagFilter,
      collector: collectorFilter,
      sortBy,
      role: user?.role,
      username: user?.username,
      fullName: user?.fullName
    })
      .then(data => {
        setInstitution(data.institution);
        setDebtors(data.debtors || []);
        setMetrics(data.metrics || null);

        if (data.institution) {
          setEditName(data.institution.name || '');
          setEditCode(data.institution.code || '');
          setEditType(data.institution.institutionType || 'commercial_bank');
          setEditContact(data.institution.contactPerson || '');
          setEditEmail(data.institution.email || '');
          setEditPhone(data.institution.phone || '');
          setEditAddress(data.institution.address || '');
          setEditNotes(data.institution.notes || '');
        }
      })
      .catch((err: unknown) => {
        const e = err as { message?: string };
        console.warn('Load institution detail error:', err);
        setError(e?.message || 'An error occurred while fetching data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, search, categoryFilter, flagFilter, collectorFilter, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Edit Institution
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!editName.trim()) {
      setEditError('Please enter an institution name.');
      return;
    }

    try {
      setEditSaving(true);
      await institutionsApi.update(id, {
        name: editName.trim(),
        code: editCode.trim(),
        institutionType: editType,
        contactPerson: editContact.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        notes: editNotes.trim()
      });

      setShowEditModal(false);
      loadData();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error updating institution');
    } finally {
      setEditSaving(false);
    }
  };

  // Bulk CSV Upload directly to this Institution
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !institution) return;

    setUploading(true);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        // 1. Process with smart auto-categorization into store
        const res = importClientsDebtorsFromCSV(content, institution.name, institution.id);

        // 2. Persist to Neon PostgreSQL in bulk
        if (res.parsedDebtors && res.parsedDebtors.length > 0) {
          try {
            await debtorsApi.bulkUpload({
              debtors: res.parsedDebtors,
              institutionId: institution.id,
              institutionName: institution.name,
              actorUsername: currentUser?.username,
              actorFullName: currentUser?.fullName
            });
          } catch (dbErr) {
            console.warn('Neon bulk sync error:', dbErr);
          }
        }

        setUploadResult({ success: res.successCount, errors: res.errors });
        loadData();
      }
      setUploading(false);
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    if (!institution) return;
    const template = `debtor,accountNumber,customerId,outstandingAmount,paidAmount,dateOfPayment,whatsappNumber,category,colorFlag,collector,notes\n"Jean Claude Nshimiyimana","ACC-${institution.code || 'BNK'}-1001","CIF-0841",1500000,300000,"2026-10-15","+250788123456","paying","blue","david","Commercial term loan installment"\n"Marie Claire Mukamana","ACC-${institution.code || 'BNK'}-1002","CIF-0922",450000,0,"","+250789654321","","","grace","Overdraft facility"`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debtors_template_${institution.code || 'institution'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportInstitutionDebtors = () => {
    if (!institution || debtors.length === 0) {
      alert('No debtor records to export.');
      return;
    }

    const headers = [
      'Debtor Name',
      'Account Number',
      'Customer ID',
      'Institution',
      'Outstanding Amount',
      'Paid Amount',
      'Remaining Balance',
      'Date of Payment',
      'WhatsApp Number',
      'Category',
      'Color Flag',
      'Assigned Collector',
      'Notes'
    ];

    const rows = debtors.map(d => [
      d.debtorName,
      d.accountNumber,
      d.customerId,
      institution.name,
      d.outstandingAmount,
      d.paidAmount,
      d.outstandingBalance,
      d.dateOfPayment || '',
      d.whatsappNumber || '',
      d.category,
      d.colorFlag,
      d.assignedCollector || '',
      (d.notes || '').replace(/"/g, '""')
    ].map(f => `"${f}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${institution.name.replace(/[^a-zA-Z0-9]/g, '_')}_debtors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = (debtor: Debtor) => {
    const link = generateWhatsAppLink(debtor);
    window.open(link, '_blank');
  };

  const getInstitutionTypeBadge = (type?: string) => {
    switch (type) {
      case 'commercial_bank':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">Commercial Bank</span>;
      case 'microfinance':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">Microfinance</span>;
      case 'sacco':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">SACCO / Cooperative</span>;
      case 'fintech':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">Digital / Fintech</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/80">Credit Lender</span>;
    }
  };

  if (loading && !institution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading institution details & debtors...</p>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Institution Not Found</h2>
        <p className="text-slate-600 mb-6">{error || 'The requested financial institution could not be located.'}</p>
        <Link
          href="/institutions"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm"
        >
          ← {t('inst_back_to_list')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Input for Direct CSV Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <Link href="/institutions" className="hover:text-blue-600 font-medium transition-colors">
            {t('nav_institutions')}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{institution.name}</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/institutions"
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            ← {t('inst_back_to_list')}
          </Link>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span>{t('inst_edit_details')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Institution Banner Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm text-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333M4.5 21V10.333M4.5 21h15" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{institution.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {institution.code && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider border border-blue-200/60">
                      {institution.code}
                    </span>
                  )}
                  {getInstitutionTypeBadge(institution.institutionType)}
                </div>
              </div>
            </div>

            {/* Institution Contact Information */}
            <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-500 pt-1">
              {institution.contactPerson && (
                <div className="flex items-center space-x-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span className="text-slate-400">Contact:</span>
                  <span className="font-medium text-slate-800">{institution.contactPerson}</span>
                </div>
              )}
              {institution.email && (
                <div className="flex items-center space-x-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-slate-400">Email:</span>
                  <a href={`mailto:${institution.email}`} className="font-medium text-blue-600 hover:underline">
                    {institution.email}
                  </a>
                </div>
              )}
              {institution.phone && (
                <div className="flex items-center space-x-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span className="text-slate-400">Phone:</span>
                  <a href={`tel:${institution.phone}`} className="font-medium text-emerald-600 hover:underline">
                    {institution.phone}
                  </a>
                </div>
              )}
              {institution.address && (
                <div className="flex items-center space-x-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="text-slate-400">Location:</span>
                  <span className="font-medium text-slate-700">{institution.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons on Banner */}
          <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span>{uploading ? 'Importing CSV...' : t('inst_upload_debtors')}</span>
                </button>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span>{t('inst_download_template')}</span>
                </button>
              </>
            )}
            <button
              onClick={handleExportInstitutionDebtors}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>{t('inst_export_debtors')}</span>
            </button>
            {currentUser?.role === 'admin' && (
              <Link
                href={`/debtors/add?client=${encodeURIComponent(institution.name)}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all active:scale-95"
              >
                <span>+</span>
                <span>{t('nav_new_debtor')}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Assigned Collectors in this Institution */}
        {metrics && metrics.assignedCollectors && metrics.assignedCollectors.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('inst_assigned_collectors')}:
            </span>
            {metrics.assignedCollectors.map(col => (
              <button
                key={col}
                onClick={() => setCollectorFilter(collectorFilter === col ? 'all' : col)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  collectorFilter === col
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span>{col}</span>
              </button>
            ))}
            {collectorFilter !== 'all' && (
              <button
                onClick={() => setCollectorFilter('all')}
                className="text-xs text-blue-600 hover:underline ml-2 font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Result Notification */}
      {uploadResult && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between ${
            uploadResult.errors.length === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div>
            <div className="flex items-center space-x-2 font-bold text-sm">
              {uploadResult.errors.length === 0 ? (
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
              <span>
                Successfully imported {uploadResult.success} debtor files into {institution.name} with auto-categorization.
              </span>
            </div>
            {uploadResult.errors.length > 0 && (
              <ul className="mt-2 text-xs list-disc list-inside text-amber-700 space-y-1">
                {uploadResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {uploadResult.errors.length > 5 && (
                  <li>...and {uploadResult.errors.length - 5} more errors.</li>
                )}
              </ul>
            )}
          </div>
          <button
            onClick={() => setUploadResult(null)}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Debtors */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{currentUser?.role === 'collector' ? 'My Assigned Debtors' : t('inst_total_debtors')}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.totalDebtors || debtors.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {currentUser?.role === 'collector' ? 'My assigned debtor accounts' : 'Institutional accounts'}
          </div>
        </div>

        {/* Total Claim Amount */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{currentUser?.role === 'collector' ? 'My Assigned Portfolio' : t('inst_total_claim')}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(metrics?.totalOutstanding || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {currentUser?.role === 'collector' ? 'My principal claim' : 'Total principal claims'}
          </div>
        </div>

        {/* Total Paid Amount */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{currentUser?.role === 'collector' ? 'My Recovered Amount' : t('inst_total_paid')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {formatCurrency(metrics?.totalPaid || 0)}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">
            {currentUser?.role === 'collector' ? 'My recovered funds' : 'Recovered portfolio'}
          </div>
        </div>

        {/* Remaining Balance & Recovery Rate */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{currentUser?.role === 'collector' ? 'My Remaining Balance' : t('inst_balance_due')}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{metrics?.recoveryRate || 0}%</span>
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">
            {formatCurrency(metrics?.totalBalance || 0)}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics?.recoveryRate || 0)}%` }}
            />
          </div>
        </div>
      </div>


      {/* Search and Advanced Filter Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Bar */}
          <div className="md:col-span-4 relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by debtor name, account, ID, phone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Color Flag Filter */}
          <div className="md:col-span-2">
            <select
              value={flagFilter}
              onChange={e => setFlagFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="none">All Flags</option>
              {COLOR_FLAGS.filter(f => f.value !== 'none').map(f => (
                <option key={f.value} value={f.value}>
                  {f.label} Priority
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Collector Filter (Admin only) */}
          {currentUser?.role === 'admin' ? (
            <div className="md:col-span-2">
              <select
                value={collectorFilter}
                onChange={e => setCollectorFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">{t('inst_all_collectors')}</option>
                {metrics?.assignedCollectors?.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="md:col-span-2">
              <div className="w-full px-3 py-2 text-xs font-semibold border border-blue-200 bg-blue-50/70 text-blue-700 rounded-lg flex items-center justify-between truncate">
                <span>Assigned Officer:</span>
                <span className="font-bold truncate ml-1">{currentUser?.fullName || currentUser?.username}</span>
              </div>
            </div>
          )}

          {/* Sort By Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 font-medium"
            >
              <option value="date_desc">{t('inst_sort_newest')}</option>
              <option value="date_asc">{t('inst_sort_oldest')}</option>
              <option value="balance_desc">{t('inst_sort_balance_high')}</option>
              <option value="balance_asc">{t('inst_sort_balance_low')}</option>
              <option value="amount_desc">{t('inst_sort_claim_high')}</option>
              <option value="name_asc">{t('inst_sort_name_asc')}</option>
            </select>
          </div>
        </div>

        {/* Status count pills */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-semibold text-slate-800">{debtors.length}</span> debtor record(s) in{' '}
            <span className="font-semibold text-slate-800">{institution.name}</span>
          </div>

          {(search || categoryFilter !== 'all' || flagFilter !== 'none' || collectorFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setFlagFilter('none');
                setCollectorFilter('all');
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Debtors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">{t('debtors_col_debtor')}</th>
                <th className="py-3.5 px-4">{t('debtors_col_account')}</th>
                <th className="py-3.5 px-4 text-right">{t('debtors_col_outstanding')}</th>
                <th className="py-3.5 px-4 text-right">{t('debtors_col_paid')}</th>
                <th className="py-3.5 px-4 text-right">{t('debtors_col_balance')}</th>
                <th className="py-3.5 px-4 text-center">{t('debtors_col_category')}</th>
                <th className="py-3.5 px-4 text-center">{t('debtors_col_flag')}</th>
                <th className="py-3.5 px-4">{t('debtors_col_collector')}</th>
                <th className="py-3.5 px-4 text-center">{t('debtors_col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debtors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-slate-800">{t('inst_no_debtors')}</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{t('inst_no_debtors_hint')}</p>
                    {currentUser?.role === 'admin' && (
                      <div className="mt-4 flex justify-center gap-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <span>{t('inst_upload_debtors')}</span>
                        </button>
                        <Link
                          href={`/debtors/add?client=${encodeURIComponent(institution.name)}`}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-sm"
                        >
                          + {t('nav_new_debtor')}
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                debtors.map(debtor => (
                  <tr
                    key={debtor.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/debtors/${debtor.id}`)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {debtor.debtorName}
                      </div>
                      <div className="text-xs text-slate-400">
                        CIF: {debtor.customerId || '—'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {debtor.accountNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      {formatCurrency(debtor.outstandingAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      {formatCurrency(debtor.paidAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-red-600">
                      {formatCurrency(debtor.outstandingBalance)}
                    </td>

                    <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                      <CategoryBadge category={debtor.category} />
                    </td>

                    <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <FlagDot flag={debtor.colorFlag} />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {debtor.assignedCollector ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {debtor.assignedCollector}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-2">
                        {debtor.whatsappNumber && (
                          <button
                            onClick={() => handleWhatsApp(debtor)}
                            title="Send WhatsApp Reminder"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs font-semibold"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.599 2.679-.702c.971.554 1.77.851 2.781.851 3.179 0 5.767-2.587 5.767-5.766.001-3.182-2.585-5.835-5.767-5.835zm3.385 8.163c-.144.405-.837.774-1.17.822-.311.045-.694.06-1.1-.07-.25-.08-.57-.198-1.002-.387-1.746-.764-2.883-2.534-2.971-2.652-.088-.117-.716-.954-.716-1.821 0-.867.453-1.294.614-1.47.161-.176.353-.22.47-.22.117 0 .235.001.338.006.11.005.257-.042.403.308.15.359.512 1.25.556 1.341.044.091.073.197.015.313-.059.117-.088.19-.176.293-.088.103-.186.23-.265.31-.088.087-.18.182-.077.359.102.176.455.751.977 1.217.672.599 1.238.785 1.414.872.176.088.279.073.382-.044.103-.117.44-.513.557-.689.118-.176.235-.147.396-.088.162.058 1.025.483 1.201.571.176.088.293.132.337.205.044.074.044.426-.1.831z"/>
                            </svg>
                          </button>
                        )}
                        <Link
                          href={`/debtors/${debtor.id}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          View File →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Institution Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <h3 className="text-lg font-bold text-slate-900">{t('inst_edit_details')}</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {editError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institution Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institution Code (e.g. BK, BPR)
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution Type
                </label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value as 'commercial_bank' | 'microfinance' | 'credit_union' | 'fintech' | 'other')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                >
                  <option value="commercial_bank">Commercial Bank</option>
                  <option value="microfinance">Microfinance Institution</option>
                  <option value="credit_union">SACCO / Credit Union</option>
                  <option value="fintech">Fintech / Digital Lending</option>
                  <option value="other">Other Financial Institution</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={editContact}
                    onChange={e => setEditContact(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Phone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : t('inst_save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
