'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingPage() {
  const { t, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('rc6_language');
    if (!stored) {
      setLang('rw');
    }
  }, [setLang]);

  if (!mounted) {
    return (
      <div 
        suppressHydrationWarning 
        className="min-h-screen bg-white text-slate-900 flex items-center justify-center font-sans"
      >
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      suppressHydrationWarning
      className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900"
    >
      {/* Header / Nav */}
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} variant="icon" className="shrink-0 drop-shadow-sm" />
            <span className="font-extrabold text-slate-900 text-base tracking-tight">{t('app_name')}</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">{t('landing_features')}</a>
            <a href="#workflow" className="hover:text-blue-600 transition">{t('landing_workflow')}</a>
            <a href="#portfolios" className="hover:text-blue-600 transition">{t('landing_portfolios')}</a>
            <Link href="/privacy" className="hover:text-blue-600 transition">{t('landing_privacy')}</Link>
            <Link href="/terms" className="hover:text-blue-600 transition">{t('landing_terms')}</Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="px-3.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              {t('landing_agent_signin')}
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              {t('landing_launch_portal')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-blue-50/40 via-slate-50/30 to-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            {t('landing_hero_badge')}
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            {t('landing_hero_title_1')} <span className="text-blue-600">{t('landing_hero_title_2')}</span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('landing_hero_desc')}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition shadow-sm hover:shadow-md"
            >
              {t('landing_access_workspace')}
            </Link>
            <a
              href="#workflow"
              className="w-full sm:w-auto px-7 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition shadow-sm"
            >
              {t('landing_view_workflow')}
            </a>
          </div>
        </div>
      </section>

      {/* Key Debt Collection Metrics */}
      <section className="py-12 border-y border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-extrabold text-blue-600 tracking-tight">{t('landing_stat_claims_val')}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{t('landing_stat_claims_lbl')}</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('landing_stat_stages_val')}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{t('landing_stat_stages_lbl')}</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{t('landing_stat_whatsapp_val')}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{t('landing_stat_whatsapp_lbl')}</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('landing_stat_recon_val')}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{t('landing_stat_recon_lbl')}</p>
          </div>
        </div>
      </section>

      {/* Core Debt Recovery Capabilities Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {t('landing_features_title')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2">
            {t('landing_features_sub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Bank Portfolio Reconciliation */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{t('landing_feat1_title')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('landing_feat1_desc')}
            </p>
          </div>

          {/* Card 2: 1-Click WhatsApp Reminders */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{t('landing_feat2_title')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('landing_feat2_desc')}
            </p>
          </div>

          {/* Card 3: 8-Stage Recovery Pipeline */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{t('landing_feat3_title')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('landing_feat3_desc')}
            </p>
          </div>

          {/* Card 4: Priority Color Flags */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{t('landing_feat4_title')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('landing_feat4_desc')}
            </p>
          </div>

          {/* Card 5: Payment & Activity History */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{t('landing_feat5_title')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('landing_feat5_desc')}
            </p>
          </div>

          {/* Card 6: Bulk CSV Portfolio Import */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{t('landing_feat6_title')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('landing_feat6_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Recovery Process (Replacing old Security section) */}
      <section id="workflow" className="py-20 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold uppercase tracking-wider">
              {t('landing_workflow_badge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('landing_workflow_title')}
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              {t('landing_workflow_sub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <span className="text-blue-600 font-extrabold text-sm font-mono">01</span>
              <h3 className="text-sm font-bold text-slate-900">{t('landing_wf_step1_title')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t('landing_wf_step1_desc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <span className="text-blue-600 font-extrabold text-sm font-mono">02</span>
              <h3 className="text-sm font-bold text-slate-900">{t('landing_wf_step2_title')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t('landing_wf_step2_desc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <span className="text-blue-600 font-extrabold text-sm font-mono">03</span>
              <h3 className="text-sm font-bold text-slate-900">{t('landing_wf_step3_title')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t('landing_wf_step3_desc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <span className="text-emerald-600 font-extrabold text-sm font-mono">04</span>
              <h3 className="text-sm font-bold text-slate-900">{t('landing_wf_step4_title')}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t('landing_wf_step4_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bank Portfolios & Call to Action Banner */}
      <section id="portfolios" className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 md:p-12 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold">
                Multi-Bank Integration
              </div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {t('landing_cta_title')}
              </h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                {t('landing_cta_sub')}
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-400">
                <span className="px-2.5 py-1 rounded-md bg-white/10">ABSA</span>
                <span className="px-2.5 py-1 rounded-md bg-white/10">Standard Bank</span>
                <span className="px-2.5 py-1 rounded-md bg-white/10">First National Bank (FNB)</span>
                <span className="px-2.5 py-1 rounded-md bg-white/10">Investec</span>
                <span className="px-2.5 py-1 rounded-md bg-white/10">Capitec</span>
                <span className="px-2.5 py-1 rounded-md bg-white/10">Nedbank</span>
              </div>
            </div>
            <Link
              href="/login"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-sm hover:shadow-md"
            >
              {t('landing_cta_btn')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <Logo size={26} variant="icon" className="shrink-0" />
            <span className="font-bold text-slate-800">{t('app_name')}</span>
            <span>© {new Date().getFullYear()} {t('landing_rights')}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition">{t('landing_privacy')}</Link>
            <Link href="/terms" className="hover:text-slate-900 transition">{t('landing_terms')}</Link>
            <Link href="/login" className="hover:text-slate-900 transition font-medium text-blue-600">{t('landing_agent_signin')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
