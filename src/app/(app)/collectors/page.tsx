'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, exportCollectorsCSV, parseCollectorsCSV } from '@/lib/store';
import { collectorsApi, activitiesApi } from '@/services/api';
import { ACTIVITY_TYPES, formatCurrency } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import type { 
  User, 
  CollectorPerformance, 
  AgencyCollectorDashboardSummary, 
  EnrichedActivity, 
  ActivitySummary,
  Debtor 
} from '@/lib/types';

export default function CollectorsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'roster'>('dashboard');

  // Dashboard & Metrics State
  const [collectorsMetrics, setCollectorsMetrics] = useState<CollectorPerformance[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<AgencyCollectorDashboardSummary | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [searchCollector, setSearchCollector] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_attention' | 'inactive' | 'active' | 'top_performer'>('all');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'uncontacted_desc' | 'interactions_asc' | 'interactions_desc' | 'rate_desc'>('balance_desc');

  // Uncontacted Modal State
  const [selectedCollectorUncontacted, setSelectedCollectorUncontacted] = useState<CollectorPerformance | null>(null);
  const [uncontactedDebtors, setUncontactedDebtors] = useState<Debtor[]>([]);
  const [loadingUncontacted, setLoadingUncontacted] = useState(false);

  // Daily Activity Monitor State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCollector, setSelectedCollector] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activityLogs, setActivityLogs] = useState<EnrichedActivity[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    totalActivities: 0,
    callsMade: 0,
    meetingsScheduled: 0,
    notesLogged: 0,
    debtorsReached: 0
  });
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Roster / Add Collector State
  const [collectorsList, setCollectorsList] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [createdNotice, setCreatedNotice] = useState<{
    username: string;
    fullName: string;
    email: string;
    tempPassword?: string;
    emailSent?: boolean;
    emailError?: string | null;
  } | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const loadMetrics = useCallback(async () => {
    try {
      setLoadingMetrics(true);
      const res = await collectorsApi.getPerformanceMetrics();
      setCollectorsMetrics(res.collectors || []);
      setDashboardSummary(res.summary || null);
    } catch (err) {
      console.warn('Failed to load collector performance metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const loadCollectorsRoster = useCallback(async () => {
    try {
      const list = await collectorsApi.list();
      setCollectorsList(list);
    } catch (err) {
      console.warn('Collectors roster fetch error:', err);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      setLoadingActivities(true);
      const res = await activitiesApi.getCollectorActivities({
        collector: selectedCollector,
        date: selectedDate,
        activityType: selectedType,
        search: searchQuery
      });
      setActivityLogs(res.activities || []);
      setActivitySummary(res.summary || {
        totalActivities: 0,
        callsMade: 0,
        meetingsScheduled: 0,
        notesLogged: 0,
        debtorsReached: 0
      });
    } catch (err) {
      console.warn('Failed to load collector activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  }, [selectedCollector, selectedDate, selectedType, searchQuery]);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadMetrics();
    loadCollectorsRoster();
  }, [router, loadMetrics, loadCollectorsRoster]);

  useEffect(() => {
    if (activeTab === 'activities') {
      loadActivities();
    } else if (activeTab === 'dashboard') {
      loadMetrics();
    }
  }, [activeTab, loadActivities, loadMetrics]);

  // Open uncontacted clients modal
  const handleOpenUncontacted = async (col: CollectorPerformance) => {
    setSelectedCollectorUncontacted(col);
    try {
      setLoadingUncontacted(true);
      const debtors = await collectorsApi.getUncontactedDebtors(col.username);
      setUncontactedDebtors(debtors);
    } catch (err) {
      console.warn('Error loading uncontacted debtors:', err);
    } finally {
      setLoadingUncontacted(false);
    }
  };

  const handleDownloadCollectors = () => {
    const csv = exportCollectorsCSV(collectorsList);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collectors_roster_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const template = 'username,fullName,email,password\n"alex_collector","Alex Smith","alex@recoverycredit.internal","collector123"\n"sarah_collector","Sarah Ndlovu","sarah@recoverycredit.internal","collector123"';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_collectors_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportActivitiesCSV = () => {
    const headers = [
      'Date',
      'Time',
      'Collector Name',
      'Collector Username',
      'Debtor (Client)',
      'Account Number',
      'CIF ID',
      'Bank / Institution',
      'Activity Type',
      'Discussion / Notes'
    ];
    const rows = activityLogs.map(a => [
      a.scheduledDate || (a.createdAt ? a.createdAt.split('T')[0] : ''),
      a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      a.collectorFullName || a.createdBy,
      a.createdBy,
      a.debtorName || '',
      a.accountNumber || '',
      a.customerId || '',
      a.bankName || a.clientName || '',
      a.activityType,
      (a.description || '').replace(/"/g, '""')
    ].map(f => `"${f}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collector_activity_logs_${selectedDate || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseCollectorsCSV(content);
        for (const col of parsed.parsedCollectors) {
          try {
            await collectorsApi.create(col);
          } catch (err) {
            console.warn('Upload collector error:', err);
          }
        }
        setUploadResult({ success: parsed.successCount, errors: parsed.errors });
        loadCollectorsRoster();
        loadMetrics();
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !fullName.trim() || !email.trim()) {
      setError('Please provide full name, official email, and username.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid official email address.');
      return;
    }

    if (password.trim()) {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter the password confirmation.');
        return;
      }
      if (password.length < 5) {
        setError('Password must be at least 5 characters long.');
        return;
      }
    }

    setSubmittingAdd(true);

    try {
      const res = await collectorsApi.create({
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || undefined
      });

      setCreatedNotice({
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        tempPassword: res.tempPassword,
        emailSent: res.emailSent,
        emailError: res.emailError || null
      });

      setUsername('');
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowAddForm(false);
      loadCollectorsRoster();
      loadMetrics();
    } catch (err: any) {
      setError(err.message || 'Error communicating with database.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const setDatePreset = (preset: 'today' | 'yesterday' | 'all') => {
    if (preset === 'today') {
      setSelectedDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      setSelectedDate(y.toISOString().split('T')[0]);
    } else {
      setSelectedDate('');
    }
  };

  // Filtered & Sorted Collector Metrics
  const filteredMetrics = collectorsMetrics
    .filter((col) => {
      const matchesSearch =
        !searchCollector ||
        col.fullName.toLowerCase().includes(searchCollector.toLowerCase()) ||
        col.username.toLowerCase().includes(searchCollector.toLowerCase()) ||
        col.email.toLowerCase().includes(searchCollector.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        col.activityStatus === statusFilter ||
        (statusFilter === 'needs_attention' && (col.activityStatus === 'needs_attention' || col.activityStatus === 'inactive'));

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'balance_desc') return b.remainingBalance - a.remainingBalance;
      if (sortBy === 'uncontacted_desc') return b.uncontactedCount - a.uncontactedCount;
      if (sortBy === 'interactions_asc') return a.totalInteractions - b.totalInteractions;
      if (sortBy === 'interactions_desc') return b.totalInteractions - a.totalInteractions;
      if (sortBy === 'rate_desc') return b.recoveryRate - a.recoveryRate;
      return 0;
    });

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('coll_title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor recovery team metrics, assigned balances, interaction history, and uncontacted debtor files.
          </p>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <span>Collector Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'activities'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Daily Call Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>Team Accounts</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COLLECTOR MONITORING DASHBOARD (METRICS & UNCONTACTED FILES) */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Agency Collector Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Remaining Balance in Collectors' Portfolios */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Remaining Balance Due</p>
                <p className="text-2xl font-black text-red-600 mt-1">
                  {formatCurrency(dashboardSummary?.totalRemainingBalance || 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Across {dashboardSummary?.totalAssignedDebtors || 0} assigned debtor files
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Total Recovered / Paid */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-slate-500">Total Money Collected</p>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    {dashboardSummary?.overallRecoveryRate || 0}% rate
                  </span>
                </div>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {formatCurrency(dashboardSummary?.totalAssignedPaid || 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Recovered from {formatCurrency(dashboardSummary?.totalAssignedClaim || 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Total Interactions Logged */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Client Interactions</p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {dashboardSummary?.totalInteractions || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Calls, meetings & negotiation notes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
            </div>

            {/* Neglected / Uncontacted Debtors (Attention Required) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Uncontacted Clients</p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {dashboardSummary?.totalUncontactedDebtors || 0}
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                  Assigned files with 0 interactions
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Inactive & Neglected Files Warning Banner */}
          {dashboardSummary && (dashboardSummary.inactiveCollectors > 0 || dashboardSummary.totalUncontactedDebtors > 0) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-amber-900">
                    Collector Performance Notice
                  </p>
                  <p className="text-amber-700 mt-0.5">
                    {dashboardSummary.inactiveCollectors > 0 && (
                      <span><strong>{dashboardSummary.inactiveCollectors} collector(s)</strong> have logged 0 interactions. </span>
                    )}
                    {dashboardSummary.totalUncontactedDebtors > 0 && (
                      <span>There are <strong>{dashboardSummary.totalUncontactedDebtors} assigned client file(s)</strong> that have never received a call or meeting.</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setStatusFilter('needs_attention');
                    setSortBy('uncontacted_desc');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
                >
                  Filter Inactive / Idle Collectors
                </button>
              </div>
            </div>
          )}

          {/* Search, Filter & Sort Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search collector by name, username..."
                value={searchCollector}
                onChange={(e) => setSearchCollector(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="all">All Collectors ({collectorsMetrics.length})</option>
                <option value="needs_attention">Needs Attention / Uncontacted Files</option>
                <option value="inactive">Inactive (0 Actions)</option>
                <option value="top_performer">Top Performers</option>
                <option value="active">Active Collectors</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="balance_desc">Sort: Highest Remaining Balance</option>
                <option value="uncontacted_desc">Sort: Most Uncontacted Clients (Lazy)</option>
                <option value="interactions_asc">Sort: Lowest Interactions (Idle First)</option>
                <option value="interactions_desc">Sort: Highest Interactions</option>
                <option value="rate_desc">Sort: Highest Recovery Rate</option>
              </select>

              {(searchCollector || statusFilter !== 'all' || sortBy !== 'balance_desc') && (
                <button
                  onClick={() => {
                    setSearchCollector('');
                    setStatusFilter('all');
                    setSortBy('balance_desc');
                  }}
                  className="px-2.5 py-1.5 text-xs text-blue-600 hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Collectors Performance Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Debt Collector Performance & Portfolio Matrix</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed view of money remaining, recovered totals, client interactions, and uncontacted debtor files.
                </p>
              </div>
            </div>

            {loadingMetrics ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-3 font-medium">Computing collector portfolio and interaction metrics...</p>
              </div>
            ) : filteredMetrics.length === 0 ? (
              <div className="py-16 text-center px-4">
                <p className="font-semibold text-slate-700 text-sm">No debt collectors match your filter</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Debt Collector</th>
                      <th className="py-3 px-4 text-center">Assigned Files</th>
                      <th className="py-3 px-4 text-right">Remaining Balance</th>
                      <th className="py-3 px-4 text-right">Collected (Paid)</th>
                      <th className="py-3 px-4 text-center">Recovery Progress</th>
                      <th className="py-3 px-4 text-center">Total Interactions</th>
                      <th className="py-3 px-4 text-center">Uncontacted Clients</th>
                      <th className="py-3 px-4 text-center">Activity Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMetrics.map((col) => {
                      const isZeroInteraction = col.totalInteractions === 0;
                      const hasHighUncontacted = col.assignedDebtorsCount > 0 && col.uncontactedCount > 0;

                      return (
                        <tr
                          key={col.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isZeroInteraction && col.assignedDebtorsCount > 0
                              ? 'bg-red-50/30'
                              : hasHighUncontacted && col.uncontactedCount >= 3
                              ? 'bg-amber-50/20'
                              : ''
                          }`}
                        >
                          {/* Collector Info */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {col.fullName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{col.fullName}</p>
                                <p className="text-[10px] text-slate-400 font-mono">@{col.username}</p>
                              </div>
                            </div>
                          </td>

                          {/* Assigned Debtors Count */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="font-semibold text-slate-800 text-xs">
                              {col.assignedDebtorsCount}
                            </span>
                            <span className="text-[10px] text-slate-400 block">cases</span>
                          </td>

                          {/* Remaining Balance Due */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <p className="font-bold text-red-600 text-xs">
                              {formatCurrency(col.remainingBalance)}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Claim: {formatCurrency(col.totalOutstanding)}
                            </p>
                          </td>

                          {/* Collected Amount */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <p className="font-bold text-emerald-600 text-xs">
                              {formatCurrency(col.totalPaid)}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-medium">
                              {col.recoveryRate}% collected
                            </p>
                          </td>

                          {/* Recovery Progress Bar */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[120px]">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, col.recoveryRate)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {col.recoveryRate}% achieved
                            </span>
                          </td>

                          {/* Total Interactions */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center">
                              <span className={`font-black text-xs ${isZeroInteraction ? 'text-red-600' : 'text-blue-600'}`}>
                                {col.totalInteractions}
                              </span>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>{col.callsMade} calls</span>
                                <span>•</span>
                                <span>{col.meetingsScheduled} mtgs</span>
                              </div>
                            </div>
                          </td>

                          {/* Uncontacted Clients (The Lazy Ones) */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {col.uncontactedCount > 0 ? (
                              <button
                                onClick={() => handleOpenUncontacted(col)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition shadow-sm"
                                title="Click to view client files with 0 interactions"
                              >
                                <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <span>{col.uncontactedCount} Uncontacted</span>
                              </button>
                            ) : col.assignedDebtorsCount === 0 ? (
                              <span className="text-slate-400 text-[11px]">No cases</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                All Contacted
                              </span>
                            )}
                          </td>

                          {/* Activity Status Badge */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {col.activityStatus === 'top_performer' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Top Performer
                              </span>
                            )}
                            {col.activityStatus === 'active' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Active Collector
                              </span>
                            )}
                            {col.activityStatus === 'needs_attention' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Needs Follow-up
                              </span>
                            )}
                            {col.activityStatus === 'inactive' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                0 Interactions
                              </span>
                            )}
                          </td>

                          {/* Quick Action Links */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedCollector(col.username);
                                  setSelectedDate('');
                                  setActiveTab('activities');
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition shadow-sm"
                                title="View activity history for this collector"
                              >
                                View Logs
                              </button>
                              <Link
                                href={`/debtors?collector=${encodeURIComponent(col.username)}`}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                                title="View all debtors assigned to this collector"
                              >
                                Debtors →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAILY ACTIVITY & PERFORMANCE MONITOR (CALENDAR LOGS) */}
      {/* ========================================================================= */}
      {activeTab === 'activities' && (
        <div className="space-y-5">
          {/* Calendar & Filter Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Calendar Date Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Calendar Date
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDatePreset('today')}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                          selectedDate === todayStr
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setDatePreset('yesterday')}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                      >
                        Yesterday
                      </button>
                      <button
                        onClick={() => setDatePreset('all')}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                          !selectedDate
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Dates
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collector, Activity Type & Search Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-2xl">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Debt Collector
                  </label>
                  <select
                    value={selectedCollector}
                    onChange={(e) => setSelectedCollector(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Collectors</option>
                    {collectorsList.map((c) => (
                      <option key={c.id} value={c.username}>
                        {c.fullName} (@{c.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Interaction Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Action Types</option>
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Search Notes / Debtor
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name, account, note..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Export Action */}
              <div className="flex items-end">
                <button
                  onClick={handleExportActivitiesCSV}
                  disabled={activityLogs.length === 0}
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Export filtered activity logs to CSV"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Filter Status Subbar */}
            {(selectedDate || selectedCollector !== 'all' || selectedType !== 'all' || searchQuery) && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>
                    Viewing activities for:{' '}
                    <strong>{selectedDate ? `Date ${selectedDate}` : 'All Dates'}</strong>
                    {selectedCollector !== 'all' && (
                      <span> • Collector: <strong>@{selectedCollector}</strong></span>
                    )}
                    {selectedType !== 'all' && (
                      <span> • Type: <strong>{selectedType}</strong></span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setSelectedCollector('all');
                    setSelectedType('all');
                    setSearchQuery('');
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Daily Activity Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Interactions</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{activitySummary.totalActivities}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Actions registered</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Phone Calls</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{activitySummary.callsMade}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Calls to debtors</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Meetings Held</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{activitySummary.meetingsScheduled}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Physical or virtual</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253 3.75h18M4.5 7.5h15a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 22.5h-15A2.25 2.25 0 012.25 20.25V9.75A2.25 2.25 0 014.5 7.5z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Debtors Contacted</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{activitySummary.debtorsReached}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Unique client files</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Registered Collector Logs & Daily Notes</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {activityLogs.length} interaction record(s)
                </p>
              </div>
            </div>

            {loadingActivities ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-3 font-medium">Loading collector interaction logs...</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Collector Activities Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {selectedDate
                    ? `No interaction logs recorded on ${selectedDate} matching your filters.`
                    : 'No interaction logs match your search criteria.'}
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSelectedDate('');
                      setSelectedCollector('all');
                      setSelectedType('all');
                      setSearchQuery('');
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    View All Activity Logs
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Debt Collector</th>
                      <th className="py-3 px-4">Client / Debtor</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Conversation Notes & Outcome</th>
                      <th className="py-3 px-4 text-right">Debtor File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activityLogs.map((log) => {
                      const typeInfo = ACTIVITY_TYPES.find((t) => t.value === log.activityType);
                      const displayDate = log.scheduledDate || (log.createdAt ? log.createdAt.split('T')[0] : '—');
                      const displayTime = log.createdAt
                        ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Date & Time */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{displayDate}</div>
                            {displayTime && (
                              <div className="text-[10px] text-slate-400 font-mono">{displayTime}</div>
                            )}
                          </td>

                          {/* Debt Collector */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                                {(log.collectorFullName || log.createdBy || 'C').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{log.collectorFullName || log.createdBy}</p>
                                <p className="text-[10px] text-slate-400 font-mono">@{log.createdBy}</p>
                              </div>
                            </div>
                          </td>

                          {/* Client / Debtor */}
                          <td className="py-3 px-4">
                            <Link
                              href={`/debtors/${log.debtorId}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                            >
                              {log.debtorName || 'Unknown Debtor'}
                            </Link>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{log.accountNumber}</span>
                              {log.bankName && <span>• {log.bankName}</span>}
                            </div>
                          </td>

                          {/* Action Type */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                log.activityType === 'call_made'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                                  : log.activityType === 'meeting_scheduled'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                  : log.activityType === 'note'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : log.activityType === 'payment_recorded'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                              }`}
                            >
                              {log.activityType === 'call_made' && (
                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                              )}
                              {log.activityType === 'meeting_scheduled' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253 3.75h18M4.5 7.5h15a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 22.5h-15A2.25 2.25 0 012.25 20.25V9.75A2.25 2.25 0 014.5 7.5z" />
                                </svg>
                              )}
                              {log.activityType === 'note' && (
                                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                              )}
                              <span>{typeInfo?.label || log.activityType}</span>
                            </span>
                          </td>

                          {/* Notes / Details */}
                          <td className="py-3 px-4 max-w-md">
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-3">
                              {log.description}
                            </p>
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Link
                              href={`/debtors/${log.debtorId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <span>View File</span>
                              <span>→</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COLLECTORS ROSTER & ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Registered Recovery Team</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage credentials, usernames, and system access for debt collection officers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadCollectors}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-1.5"
                title="Download Collectors CSV"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Download Roster CSV</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-1.5"
                title="Bulk Upload Collectors CSV"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span>Bulk Upload CSV</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition shadow-sm"
                title="Download CSV Template"
              >
                CSV Template
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Add New Collector'}</span>
              </button>
            </div>
          </div>

          {/* Upload Notification Banner */}
          {uploadResult && (
            <div className={`p-4 rounded-xl border text-xs flex items-start justify-between ${
              uploadResult.errors.length === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div>
                <p className="font-semibold">
                  Bulk Upload Finished: {uploadResult.success} collector account(s) created successfully.
                </p>
                {uploadResult.errors.length > 0 && (
                  <ul className="mt-1.5 list-disc pl-4 text-red-600 space-y-0.5">
                    {uploadResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button 
                onClick={() => setUploadResult(null)}
                className="text-slate-400 hover:text-slate-600 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add New Collector Card */}
          {showAddForm && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-900">{t('coll_card_title')}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('coll_card_subtitle')}
                </p>
              </div>

              <form onSubmit={handleAddCollector} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">{t('coll_lbl_fullname')}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Ndlovu"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">{t('coll_lbl_email')}</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah.ndlovu@agency.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">{t('coll_lbl_username')}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. sarah"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Temporary Password <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank for auto-OTP"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      If blank, an OTP is generated and emailed to collector.
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Confirm Password <span className="text-slate-400 font-normal">(If set manually)</span>
                    </label>
                    <input
                      type="password"
                      disabled={!password.trim()}
                      placeholder={password.trim() ? "••••••••" : "Not required for auto-OTP"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={submittingAdd}
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingAdd ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating & Sending Email...</span>
                      </>
                    ) : (
                      <span>Create Collector Account</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Collectors List Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-medium">
                    <th className="py-3 px-4 font-medium">{t('coll_th_name')}</th>
                    <th className="py-3 px-4 font-medium">{t('coll_th_username')}</th>
                    <th className="py-3 px-4 font-medium">{t('coll_th_email')}</th>
                    <th className="py-3 px-4 font-medium">System Role</th>
                    <th className="py-3 px-4 font-medium">Created Date</th>
                    <th className="py-3 px-4 font-medium text-right">{t('coll_th_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {collectorsList.map((col) => (
                    <tr key={col.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">
                            {col.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{col.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">@{col.username}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {col.email || <span className="text-slate-400 italic">No email set</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                          {t('role_officer')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(col.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Active Officer
                        </span>
                      </td>
                    </tr>
                  ))}

                  {collectorsList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <p className="font-semibold text-slate-700 text-sm">No debt collectors registered yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Click the &quot;{t('coll_btn_add')}&quot; button above to create accounts for your agents.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UNCONTACTED CLIENTS ASSIGNED TO COLLECTOR */}
      {/* ========================================================================= */}
      {selectedCollectorUncontacted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[85vh] space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Neglected / Idle Files
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Uncontacted Debtors Assigned to {selectedCollectorUncontacted.fullName}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  The following {uncontactedDebtors.length} debtor file(s) have never received a logged phone call, meeting, or note from this collector (@{selectedCollectorUncontacted.username}).
                </p>
              </div>

              <button
                onClick={() => setSelectedCollectorUncontacted(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {loadingUncontacted ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2 font-medium">Loading uncontacted debtor files...</p>
              </div>
            ) : uncontactedDebtors.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <p className="font-semibold text-slate-700">No uncontacted files found</p>
                <p className="text-slate-400 mt-0.5">All assigned debtors have at least one logged interaction.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Debtor (Bank Client)</th>
                      <th className="py-2.5 px-3">Account No</th>
                      <th className="py-2.5 px-3">Client (Bank)</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uncontactedDebtors.map((debtor) => (
                      <tr key={debtor.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3">
                          <Link
                            href={`/debtors/${debtor.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition"
                          >
                            {debtor.debtorName}
                          </Link>
                          {debtor.customerId && (
                            <span className="text-[10px] text-slate-400 block">CIF: {debtor.customerId}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {debtor.accountNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {debtor.bankName || debtor.clientName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">
                          {formatCurrency(debtor.outstandingBalance)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            0 Interactions
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/debtors/${debtor.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700 transition shadow-sm"
                          >
                            <span>Open File</span>
                            <span>→</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Total Uncontacted Exposure: <strong className="text-red-600">{formatCurrency(uncontactedDebtors.reduce((acc, d) => acc + d.outstandingBalance, 0))}</strong>
              </span>
              <button
                onClick={() => setSelectedCollectorUncontacted(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COLLECTOR CREATION & OTP CONFIRMATION */}
      {/* ========================================================================= */}
      {createdNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Collector Account Created</h3>
                  <p className="text-xs text-slate-500">Officer credential & OTP details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCreatedNotice(null);
                  setCopiedOtp(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Officer Details */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Full Name:</span>
                <span className="font-semibold text-slate-800">{createdNotice.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="font-mono text-slate-800">@{createdNotice.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-medium text-slate-800">{createdNotice.email}</span>
              </div>
            </div>

            {/* Email Dispatch Status */}
            <div>
              {createdNotice.emailSent ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <div>
                    <p className="font-semibold">Welcome Email Dispatched via Resend</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      The collector has received their temporary login credentials and password upgrade link at <span className="underline">{createdNotice.email}</span>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Email Delivery Notice</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {createdNotice.emailError || 'Resend sandbox mode limits external delivery. You can share the temporary OTP directly below.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Temporary OTP Display Card */}
            {createdNotice.tempPassword && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                    One-Time Password (OTP)
                  </span>
                  <span className="text-[10px] text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded font-medium">
                    Must be changed on first login
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white px-3 py-2 rounded-lg border border-blue-200 font-mono text-sm font-bold text-slate-900">
                  <span className="select-all tracking-wider">{createdNotice.tempPassword}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (createdNotice.tempPassword) {
                        navigator.clipboard.writeText(createdNotice.tempPassword);
                        setCopiedOtp(true);
                        setTimeout(() => setCopiedOtp(false), 2000);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
                  >
                    {copiedOtp ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                        <span>Copy OTP</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Upon logging in with this OTP, the officer will be automatically routed to a mandatory password change screen before being granted access to client files.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCreatedNotice(null);
                  setCopiedOtp(false);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
