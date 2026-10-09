'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initializeStore, login, isLoggedIn } from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Security features: Lockout after 5 failed attempts
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    initializeStore();
    if (isLoggedIn()) {
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  }, [router]);

  // Lockout countdown timer
  useEffect(() => {
    let interval: any;
    if (lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError(`Account temporarily locked due to excessive failed attempts. Try again in ${lockTimer}s.`);
      return;
    }

    if (!acceptedTerms) {
      setError('You must read and strictly accept the Terms of Service & Privacy Notice before accessing debt data.');
      return;
    }

    const user = login(username, password);
    if (user) {
      setFailedAttempts(0);
      router.push('/dashboard');
    } else {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (nextFailures >= 5) {
        setIsLocked(true);
        setLockTimer(60); // 60 seconds lockout
        setError('Security threshold triggered: 5 failed attempts. Login locked for 60 seconds.');
      } else {
        setError(`Invalid credentials. ${5 - nextFailures} attempt(s) remaining before security lockout.`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Bar with Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSwitcher />
      </div>

      {/* Top Brand Link */}
      <div className="text-center pt-2">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
          <Logo size={42} variant="icon" className="shrink-0 drop-shadow-sm" />
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">{t('app_name')}</span>
        </Link>
        <p className="text-xs text-slate-500">{t('login_portal_subtitle')}</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{t('login_card_title')}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('login_card_desc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">{t('login_lbl_username')}</label>
              <input
                type="text"
                disabled={isLocked}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-50"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">{t('login_lbl_pass')}</label>
              <input
                type="password"
                disabled={isLocked}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-50"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Strict Compliance Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 shrink-0"
                  required
                />
                <span className="text-[11px] text-slate-600 leading-snug">
                  {t('login_terms_certify')}{' '}
                  <Link href="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">
                    {t('login_terms')}
                  </Link>{' '}
                  {t('login_terms_and')}{' '}
                  <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">
                    {t('login_privacy')}
                  </Link>
                  {t('login_terms_logged')}
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLocked}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm text-xs mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLocked ? `Locked (${lockTimer}s)` : t('login_btn_submit')}
            </button>
          </form>

          {/* Security Features Badge */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {t('login_ssl_badge')}
            </span>
            <span>{t('login_demo_hint')}</span>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="text-center text-xs text-slate-400 space-x-4">
        <Link href="/" className="hover:text-slate-600 transition">{t('login_back_home')}</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-slate-600 transition">{t('login_privacy')}</Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-slate-600 transition">{t('login_terms')}</Link>
        <span>•</span>
        <Link href="/security" className="hover:text-slate-600 transition">{t('login_security')}</Link>
      </div>
    </div>
  );
}
