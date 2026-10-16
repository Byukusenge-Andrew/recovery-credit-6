'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/store';
import { auditApi } from '@/services/api';
import { useLanguage } from '@/components/LanguageContext';
import { AuditLog, User } from '@/lib/types';

interface StructuredExplanation {
  tag: string;
  tagColor: string;
  primaryText: string;
  badge?: string;
  secondaryText?: string;
}

export default function AuditPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [logs, setLogs] = useState<readonly AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    auditApi.list()
      .then(data => setLogs(data))
      .catch(err => console.warn('Audit fetch error:', err));
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  // Filter logs based on search and selected action/actor
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      searchQuery === '' ||
      log.actorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesActor = actorFilter === 'all' || log.actorUsername.toLowerCase() === actorFilter.toLowerCase();

    return matchesSearch && matchesAction && matchesActor;
  });

  // Extract unique actors for filter dropdown
  const uniqueActors = Array.from(new Set(logs.map(l => l.actorUsername)));

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'create_debtor':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'record_payment':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delete_debtor':
      case 'delete_payment':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'update_debtor':
      case 'update_user':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'add_collector':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'import_csv':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'login':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'logout':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getActionLabel = (action: string) => {
    const isRw = language === 'rw';
    switch (action) {
      case 'create_debtor': return isRw ? 'Kurema Umwenda' : 'Create Debtor';
      case 'update_debtor': return isRw ? 'Kuvugurura Umwenda' : 'Update Debtor';
      case 'delete_debtor': return isRw ? 'Gusiba Umwenda' : 'Delete Debtor';
      case 'record_payment': return isRw ? 'Kwandika Ubwishyu' : 'Record Payment';
      case 'delete_payment': return isRw ? 'Gusiba Ubwishyu' : 'Delete Payment';
      case 'log_activity': return isRw ? 'Kwandika Igikorwa' : 'Log Activity';
      case 'import_csv': return isRw ? 'Kwinjiza Dosiye (CSV)' : 'CSV Data Import';
      case 'add_collector': return isRw ? 'Kwinjiza Umukozi' : 'Add Collector';
      case 'update_user': return isRw ? 'Kuvugurura Umwirondoro' : 'Update User';
      case 'login': return isRw ? 'Kwinjira muri Sisitemu' : 'User Login';
      case 'logout': return isRw ? 'Gusohoka' : 'User Logout';
      default: return action;
    }
  };

  /**
   * Parse and structure the audit trail explanations (Ibisobanuro)
   */
  const formatExplanation = (log: AuditLog): StructuredExplanation => {
    const isRw = language === 'rw';
    let raw = (log.details || '').trim();

    // Strip legacy database mentions if any
    raw = raw
      .replace(/\s+in Neon PostgreSQL\.?/gi, '.')
      .replace(/\s+via Neon PostgreSQL\.?/gi, '.')
      .replace(/\s+into Neon PostgreSQL database\.?/gi, ' into system ledger.')
      .replace(/\s+from Neon PostgreSQL\.?/gi, '.')
      .replace(/\s+in Neon\.?/gi, '.')
      .replace(/\s+via N$/gi, '.');

    switch (log.action) {
      case 'add_collector': {
        // Extract collector username
        const match = raw.match(/['@]([a-zA-Z0-9_\-\.]+)['\s]/) || log.targetDescription.match(/Collector:\s*([^\s(]+)/);
        const uname = match ? match[1] : (log.targetId || 'collector');
        return {
          tag: isRw ? 'Konti Nshya' : 'New Collector',
          tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
          badge: `@${uname}`,
          primaryText: isRw 
            ? `Konti y'umukozi ushinzwe kwishyuza yaremwe neza ifite uburenganzira bwo kwinjira.`
            : `Collector user account created with access to assigned debtor records.`,
          secondaryText: isRw ? 'Uruhare: Umukozi wo Kwishyuza' : 'Role: Debt Collector'
        };
      }

      case 'login': {
        const uname = log.actorUsername || 'admin';
        return {
          tag: isRw ? 'Kwinjira Neza' : 'Auth Success',
          tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badge: `@${uname}`,
          primaryText: isRw
            ? `Umukoresha yinjiye muri sisitemu neza binyuze kuri murandasi.`
            : `User session successfully authenticated and started.`,
          secondaryText: log.ipAddress ? `IP: ${log.ipAddress}` : undefined
        };
      }

      case 'import_csv': {
        const countMatch = log.targetDescription.match(/(\d+)\s*debtors?/i) || raw.match(/(\d+)\s*debtors?/i);
        const count = countMatch ? countMatch[1] : '';
        return {
          tag: isRw ? 'Kwinjiza Dosiye' : 'Batch Import',
          tagColor: 'bg-teal-50 text-teal-700 border-teal-200',
          badge: count ? `${count} ${isRw ? 'Dosiye' : 'Records'}` : undefined,
          primaryText: isRw
            ? `Amadosiye y'abafite imyenda yashyizwe muri sisitemu mu buryo bwa rimwe.`
            : `Debtor batch upload processed and persisted into the system database.`,
        };
      }

      case 'create_debtor': {
        return {
          tag: isRw ? 'Kurema Umwenda' : 'Debtor Created',
          tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
          primaryText: isRw
            ? `Dosiye nshya y'umukiriya ifite umwenda yanditswe muri sisitemu.`
            : `New debtor recovery record initialized.`,
          secondaryText: raw.includes('Claim:') ? raw.split('Claim:')[1]?.trim() : undefined
        };
      }

      case 'record_payment': {
        return {
          tag: isRw ? 'Ubwishyu' : 'Payment Logged',
          tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          primaryText: isRw
            ? `Ubwishyu bw'umwenda bwanditswe kandi bugabanywa ku mwenda wose.`
            : `Payment received and credited towards debtor outstanding balance.`,
          secondaryText: raw.replace('Recorded payment of ', '')
        };
      }

      case 'delete_payment': {
        return {
          tag: isRw ? 'Gusiba Ubwishyu' : 'Payment Reversal',
          tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
          primaryText: isRw
            ? `Inyandiko y'ubwishyu yasibwe n'umuyobozi, umwenda urongerwa.`
            : `Payment transaction removed by administrator; balance readjusted.`
        };
      }

      case 'update_debtor': {
        return {
          tag: isRw ? 'Ivugururwa' : 'Record Updated',
          tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
          primaryText: isRw
            ? `Imiterere n'amakuru y'umwenda byavuguruwe muri sisitemu.`
            : `Debtor details, payment status or collection category updated.`
        };
      }

      case 'delete_debtor': {
        return {
          tag: isRw ? 'Gusiba Umwenda' : 'Record Purged',
          tagColor: 'bg-red-50 text-red-700 border-red-200',
          primaryText: isRw
            ? `Dosiye y'umwenda yasibwe burundu muri sisitemu n'umuyobozi.`
            : `Debtor file and recovery case permanently deleted by administrator.`
        };
      }

      case 'update_user': {
        return {
          tag: isRw ? 'Umwirondoro' : 'Profile Updated',
          tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          primaryText: isRw
            ? `Amakuru y'umwirondoro cyangwa ijambobanga byavuguruwe.`
            : `User account credentials or personal details successfully updated.`
        };
      }

      default: {
        return {
          tag: isRw ? 'Igikorwa' : 'System Event',
          tagColor: 'bg-slate-50 text-slate-700 border-slate-200',
          primaryText: raw || log.action
        };
      }
    }
  };

  /**
   * Clean up target description display (e.g. remove duplicated `jean_collector (jean_collector)`)
   */
  const cleanTargetDescription = (desc: string) => {
    if (!desc) return '';
    // If format is Collector: name (name)
    const colMatch = desc.match(/Collector:\s*([^\s(]+)\s*\(\1\)/i);
    if (colMatch) {
      return `Collector: @${colMatch[1]}`;
    }
    const userMatch = desc.match(/User:\s*([^\s(]+)\s*\(\1\)/i);
    if (userMatch) {
      return `User: @${userMatch[1]}`;
    }
    return desc;
  };

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Actor Username', 'Actor Full Name', 'Role', 'Action', 'Target', 'Details', 'Audit ID'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.actorUsername,
      l.actorFullName,
      l.actorRole,
      l.action,
      l.targetDescription.replace(/"/g, '""'),
      l.details.replace(/"/g, '""'),
      l.id
    ].map(f => `"${f}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {language === 'rw' ? 'Uburyo bwo Kugenzura Idasibwa (Immutable Ledger)' : 'Immutable Audit Trail'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'rw' ? 'Inyandiko z’Ibikorwa muri Sisitemu' : 'System Audit Logs'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'rw' 
              ? 'Urutonde rudasibwa rw’ibikorwa byose byakozwe n’abakozi n’abayobozi (Ababikoze, igihe, n’ibisobanuro bihamye).' 
              : 'Permanent, tamper-proof record of all operator actions, payments, file updates, and collector activities.'}
          </p>
        </div>

        <button
          onClick={exportAuditCSV}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span>{language === 'rw' ? 'Kuvana Raporo muri CSV' : 'Export Audit CSV'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={language === 'rw' ? 'Shakisha ku mukozi, igikorwa, dosiye, ibisobanuro...' : 'Search by actor, target, action or structured details...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
          >
            <option value="all">{language === 'rw' ? 'Ibikorwa Byose' : 'All Actions'}</option>
            <option value="add_collector">{language === 'rw' ? 'Kwinjiza Umukozi' : 'Add Collector'}</option>
            <option value="login">{language === 'rw' ? 'Kwinjira muri Sisitemu' : 'User Login'}</option>
            <option value="import_csv">{language === 'rw' ? 'Kwinjiza Dosiye (CSV)' : 'CSV Import'}</option>
            <option value="create_debtor">{language === 'rw' ? 'Kurema Umwenda' : 'Create Debtor'}</option>
            <option value="update_debtor">{language === 'rw' ? 'Kuvugurura Umwenda' : 'Update Debtor'}</option>
            <option value="delete_debtor">{language === 'rw' ? 'Gusiba Umwenda' : 'Delete Debtor'}</option>
            <option value="record_payment">{language === 'rw' ? 'Kwandika Ubwishyu' : 'Record Payment'}</option>
            <option value="delete_payment">{language === 'rw' ? 'Gusiba Ubwishyu' : 'Delete Payment'}</option>
            <option value="log_activity">{language === 'rw' ? 'Kwandika Igikorwa' : 'Log Activity'}</option>
            <option value="update_user">{language === 'rw' ? 'Kuvugurura Umukoresha' : 'Update User'}</option>
          </select>

          {/* Actor Filter */}
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
          >
            <option value="all">{language === 'rw' ? 'Abakozi Bose' : 'All Users/Actors'}</option>
            {uniqueActors.map(actor => (
              <option key={actor} value={actor}>{actor}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 text-sm">
              {language === 'rw' ? 'Inyandiko Zose' : 'Audit Trail Entries'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
              {filteredLogs.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {language === 'rw' ? 'Izi nyandiko zandikwa gusa ntizisibwa' : 'Append-only immutable record'}
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {language === 'rw' ? 'Nta nyandiko z’ibikorwa zibonetse.' : 'No audit entries match the current filter criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-medium">
                <tr>
                  <th className="py-3 px-4 min-w-35">{language === 'rw' ? 'Igihe (Timestamp)' : 'Timestamp'}</th>
                  <th className="py-3 px-4 min-w-45">{language === 'rw' ? 'Uwabikoze (Actor)' : 'Actor (User)'}</th>
                  <th className="py-3 px-4 min-w-37.5">{language === 'rw' ? 'Igikorwa' : 'Action'}</th>
                  <th className="py-3 px-4 min-w-45">{language === 'rw' ? 'Icyakozweho (Target)' : 'Target'}</th>
                  <th className="py-3 px-4 min-w-[320px]">{language === 'rw' ? 'Ibisobanuro' : 'Details & Context'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString();
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const structured = formatExplanation(log);
                  const cleanTarget = cleanTargetDescription(log.targetDescription);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-mono text-xs">{formattedDate}</span>
                        </div>
                        <span className="text-slate-400 block text-[11px] font-mono mt-0.5 pl-5">{formattedTime}</span>
                      </td>

                      {/* 2. Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0">
                            {log.actorUsername.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-xs">{log.actorFullName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-500 font-mono">@{log.actorUsername}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                {log.actorRole}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-xs ${getActionBadgeClass(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>

                      {/* 4. Target */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-800 font-medium text-xs break-words" title={log.targetDescription}>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-700 text-[11px] border border-slate-200/80 inline-block font-mono">
                            {cleanTarget}
                          </span>
                        </div>
                      </td>

                      {/* 5. Structured Explanations (Ibisobanuro) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1.5">
                          {/* Top Pill / Badge row */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${structured.tagColor}`}>
                              {structured.tag}
                            </span>
                            {structured.badge && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                {structured.badge}
                              </span>
                            )}
                            {structured.secondaryText && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {structured.secondaryText}
                              </span>
                            )}
                          </div>

                          {/* Primary descriptive sentence */}
                          <p className="text-slate-700 text-xs leading-relaxed">
                            {structured.primaryText}
                          </p>
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
  );
}
