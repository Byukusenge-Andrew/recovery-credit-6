'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile, getDashboardStats } from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';
import type { User } from '@/lib/types';
import Link from 'next/link';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Profile details state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick stats
  const [assignedCount, setAssignedCount] = useState(0);

  useEffect(() => {
    setIsClientLoaded(true);
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      const stats = getDashboardStats();
      setAssignedCount(stats.totalDebtors);
    }
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!fullName.trim()) {
      setProfileMsg({ type: 'error', text: 'Full name cannot be blank.' });
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setProfileMsg({ type: 'error', text: 'Please enter a valid email address.' });
        return;
      }
    }

    const result = updateUserProfile({
      fullName: fullName.trim(),
      email: email.trim() || undefined,
    });

    if (result.success && result.user) {
      setCurrentUser(result.user);
      setProfileMsg({ type: 'success', text: 'Profile details updated successfully.' });
    } else {
      setProfileMsg({ type: 'error', text: result.message });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (currentUser && currentUser.password !== currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' });
      return;
    }

    if (newPassword.length < 5) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 5 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const result = updateUserProfile({ password: newPassword });
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Password successfully updated.' });
    } else {
      setPasswordMsg({ type: 'error', text: result.message });
    }
  };

  if (!isClientLoaded || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isCollector = currentUser.role === 'collector';
  const roleLabel = isCollector ? t('role_officer') : t('role_administrator');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('prof_title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {t('prof_subtitle')}
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl uppercase tracking-wider shrink-0 shadow-sm">
              {currentUser.username.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {currentUser.fullName || currentUser.username}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">@{currentUser.username}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>
                  Email:{' '}
                  <strong className="text-slate-700 font-medium">
                    {currentUser.email || 'No email attached'}
                  </strong>
                </span>
                {currentUser.email && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                    {t('coll_pending_verify')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="sm:text-right shrink-0 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 block">
              {isCollector ? t('prof_overview_queue') : t('prof_overview_agency')}
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {isCollector ? `${assignedCount} Accounts` : t('prof_overview_full')}
            </p>
            <Link
              href="/dashboard"
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition block mt-1"
            >
              Go to Workspace →
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Edit Info & Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('prof_account_details')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('prof_account_sub')}</p>
          </div>

          {profileMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">{t('prof_lbl_username')}</label>
              <input
                type="text"
                disabled
                value={currentUser.username}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">{t('prof_hint_username')}</p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">{t('prof_lbl_fullname')}</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Byiringiro James"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">{t('prof_lbl_email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@recoverycredit.co.za"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {t('prof_hint_email')}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm text-xs"
              >
                {t('prof_btn_save')}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('prof_security_title')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('prof_security_sub')}</p>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">{t('prof_lbl_current_pass')}</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">{t('prof_lbl_new_pass')}</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 5 characters"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">{t('prof_lbl_confirm_pass')}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition shadow-sm text-xs"
              >
                {t('prof_btn_update_pass')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
