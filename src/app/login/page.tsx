'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initializeStore, getCurrentUser, setAuthUser, setAuthToken } from '@/lib/store';
import { authApi } from '@/services/api';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Security features: Lockout after 5 failed attempts
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    initializeStore();
    async function checkExistingAuth() {
      if (getCurrentUser()) {
        router.push('/dashboard');
        return;
      }
      try {
        const res = await authApi.me();
        if (res.success && res.user) {
          setAuthUser(res.user);
          router.push('/dashboard');
          return;
        }
      } catch {
        // Not authenticated
      }
      setLoading(false);
    }
    checkExistingAuth();
  }, [router]);

  // Lockout countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
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
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError(`Account temporarily locked due to excessive failed attempts. Please retry in ${lockTimer}s.`);
      return;
    }

    if (!acceptedTerms) {
      setError('You must confirm authorization and accept the Terms of Service & Privacy Policy.');
      return;
    }

    setSubmitting(true);

    try {
      const data = await authApi.login({ usernameOrEmail: username.trim(), password });
      if (data.user) {
        setAuthUser(data.user);
        if (data.token) {
          setAuthToken(data.token);
        }
        setFailedAttempts(0);
        router.push('/dashboard');
        return;
      }
    } catch (err: any) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (nextFailures >= 5) {
        setIsLocked(true);
        setLockTimer(60); // 60 seconds lockout
        setError('Security threshold triggered: 5 failed attempts. Account locked for 60 seconds.');
      } else {
        setError(err.message || `Invalid credentials. ${5 - nextFailures} attempt(s) remaining before security lockout.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setAcceptedTerms(true);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-7 h-7 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/70 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Subtle architectural background grid - quiet, enterprise, no neon/gradient slop */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.35]" 
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} 
      />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 transition opacity-90 hover:opacity-100">
            <Logo size={28} variant="icon" className="shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">{t('app_name')}</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                Security Gateway
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{t('login_back_home')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Authentication Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[410px]">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_12px_24px_-8px_rgba(15,23,42,0.04)] p-6 sm:p-8 space-y-5">
            {/* Header info */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-2.5">
                <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Authorized Access Only</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('login_card_title')}</h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('login_card_desc')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Username Input */}
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  {t('login_lbl_username')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    disabled={isLocked || submitting}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition disabled:opacity-50"
                    placeholder="e.g. admin or collector"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-medium text-slate-700">
                    {t('login_lbl_pass')}
                  </label>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    Auto-fill Demo
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={isLocked || submitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition disabled:opacity-50 font-sans"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Compliance / Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500/20 shrink-0 cursor-pointer"
                    required
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    {t('login_terms_certify')}{' '}
                    <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-medium">
                      {t('login_terms')}
                    </Link>{' '}
                    {t('login_terms_and')}{' '}
                    <Link href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-medium">
                      {t('login_privacy')}
                    </Link>
                    {t('login_terms_logged')}
                  </span>
                </label>
              </div>

              {/* Feedback / Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-start gap-2 leading-relaxed animate-fadeIn">
                  <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="flex-1 font-medium">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLocked || submitting}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition shadow-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : isLocked ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Locked ({lockTimer}s)</span>
                  </>
                ) : (
                  <>
                    <span>{t('login_btn_submit')}</span>
                    <svg className="w-3.5 h-3.5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Security Badge and Demo Hint */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('login_ssl_badge')}
              </span>
              <span className="font-mono text-slate-500">
                {t('login_demo_hint')}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-10 w-full py-4 px-6 border-t border-slate-200/50 bg-white/40 text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/" className="hover:text-slate-600 transition">{t('login_back_home')}</Link>
          <span className="text-slate-300">&bull;</span>
          <Link href="/privacy" className="hover:text-slate-600 transition">{t('login_privacy')}</Link>
          <span className="text-slate-300">&bull;</span>
          <Link href="/terms" className="hover:text-slate-600 transition">{t('login_terms')}</Link>
          <span className="text-slate-300">&bull;</span>
          <Link href="/security" className="hover:text-slate-600 transition">{t('login_security')}</Link>
        </div>
      </footer>
    </div>
  );
}
