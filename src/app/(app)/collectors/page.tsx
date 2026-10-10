'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUsers, addUser, getCurrentUser, exportCollectorsCSV, importCollectorsFromCSV } from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';
import type { User } from '@/lib/types';

export default function CollectorsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [collectors, setCollectors] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; errors: string[] } | null>(null);

  // New collector form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const loadCollectors = () => {
    const allUsers = getUsers();
    setCollectors(allUsers.filter(u => u.role === 'collector'));
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadCollectors();
  }, [router]);

  const handleDownloadCollectors = () => {
    const csv = exportCollectorsCSV();
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importCollectorsFromCSV(content);
        setUploadResult({ success: res.successCount, errors: res.errors });
        loadCollectors();
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddCollector = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid official email address.');
      return;
    }

    // Password & Confirm Password match check
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter the password confirmation.');
      return;
    }

    if (password.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }

    // Check if username or email already exists
    const users = getUsers();
    const existingUsername = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (existingUsername) {
      setError(`A user with username "${username}" already exists.`);
      return;
    }

    const existingEmail = users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingEmail) {
      setError(`A user with email "${email}" already exists.`);
      return;
    }

    addUser({
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role: 'collector',
      isEmailVerified: false
    });

    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowAddForm(false);
    loadCollectors();
  };

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
            {t('coll_subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Collectors CSV */}
          <button
            onClick={handleDownloadCollectors}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-1.5"
            title="Download Collectors CSV"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Download CSV</span>
          </button>

          {/* Bulk Upload Collectors CSV */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-1.5"
            title="Bulk Upload Collectors CSV"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
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
            <span>{showAddForm ? t('coll_btn_close') : t('coll_btn_add')}</span>
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
                <label className="block font-medium text-slate-700 mb-1">{t('coll_lbl_pass')}</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{t('coll_lbl_confirm_pass')}</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition"
              >
                {t('coll_btn_create')}
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
              {collectors.map((col) => (
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
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                      {t('coll_pending_verify')}
                    </span>
                  </td>
                </tr>
              ))}

              {collectors.length === 0 && (
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
  );
}
