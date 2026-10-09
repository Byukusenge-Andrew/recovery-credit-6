'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUsers, addUser, getCurrentUser } from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';
import type { User } from '@/lib/types';

export default function CollectorsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [collectors, setCollectors] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('coll_title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('coll_subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm self-start flex items-center gap-1.5"
        >
          <span>{showAddForm ? t('coll_btn_close') : t('coll_btn_add')}</span>
        </button>
      </div>

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
