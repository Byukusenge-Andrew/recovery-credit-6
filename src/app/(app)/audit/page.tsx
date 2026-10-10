'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getAuditLogs } from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';
import { AuditLog, User } from '@/lib/types';

export default function AuditPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<readonly AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setLogs(getAuditLogs());
  }, [router]);

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
        return 'bg-red-50 text-red-700 border-red-200';
      case 'update_debtor':
      case 'update_user':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'add_collector':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'import_csv':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'login':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'logout':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create_debtor': return 'Create Debtor';
      case 'update_debtor': return 'Update Debtor';
      case 'delete_debtor': return 'Delete Debtor';
      case 'record_payment': return 'Record Payment';
      case 'log_activity': return 'Log Activity';
      case 'import_csv': return 'CSV Data Import';
      case 'add_collector': return 'Add Collector';
      case 'update_user': return 'Update User';
      case 'login': return 'User Login';
      case 'logout': return 'User Logout';
      default: return action;
    }
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
              ? 'Urutonde rudasibwa rw’ibikorwa byose byakozwe n’abakozi n’abayobozi (Ababikoze, igihe, n’amakuru arambuye).' 
              : 'Permanent, tamper-proof record of all operator actions, payments, file updates, and collector activities.'}
          </p>
        </div>

        <button
          onClick={exportAuditCSV}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
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
            placeholder={language === 'rw' ? 'Shakisha ku mukozi, igikorwa, dosiye...' : 'Search by actor, target file, action or details...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="all">{language === 'rw' ? 'Ibikorwa Byose' : 'All Actions'}</option>
            <option value="create_debtor">Create Debtor</option>
            <option value="update_debtor">Update Debtor</option>
            <option value="delete_debtor">Delete Debtor</option>
            <option value="record_payment">Record Payment</option>
            <option value="log_activity">Log Activity</option>
            <option value="import_csv">CSV Import</option>
            <option value="add_collector">Add Collector</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>

          {/* Actor Filter */}
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
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
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]">
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
                  <th className="py-3 px-4">{language === 'rw' ? 'Igihe (Timestamp)' : 'Timestamp'}</th>
                  <th className="py-3 px-4">{language === 'rw' ? 'Uwabikoze (Actor)' : 'Actor (User)'}</th>
                  <th className="py-3 px-4">{language === 'rw' ? 'Igikorwa' : 'Action'}</th>
                  <th className="py-3 px-4">{language === 'rw' ? 'Icyakozweho (Target)' : 'Target'}</th>
                  <th className="py-3 px-4">{language === 'rw' ? 'Ibisobanuro' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString();
                  const formattedTime = dateObj.toLocaleTimeString();

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <span className="font-mono text-slate-700 font-semibold">{formattedDate}</span>
                        <span className="text-slate-400 block text-[11px] font-mono">{formattedTime}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {log.actorUsername.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">{log.actorFullName}</span>
                            <span className="text-[11px] text-slate-400">@{log.actorUsername} ({log.actorRole})</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadgeClass(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-[200px] truncate" title={log.targetDescription}>
                        {log.targetDescription}
                      </td>
                      <td className="py-3 px-4 text-slate-600 leading-relaxed max-w-[320px]">
                        {log.details}
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
