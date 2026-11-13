'use client';

import Link from 'next/link';
import Logo, { BrandWordmark } from '@/components/Logo';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { TranslationKey } from '@/lib/i18n';

// Heroicons outline paths (1.75 stroke), kept local to the landing page.
const ICONS = {
  ledger: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  chat: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  stages: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z',
  flag: 'M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5',
  history: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  upload: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  device: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
  audit: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
  admin: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
  field: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  check: 'M4.5 12.75l6 6 9-13.5',
  arrow: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3',
};

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const FEATURES: { icon: string; title: TranslationKey; desc: TranslationKey; tone: string }[] = [
  { icon: ICONS.ledger, title: 'landing_feat1_title', desc: 'landing_feat1_desc', tone: 'bg-blue-50 text-blue-600' },
  { icon: ICONS.chat, title: 'landing_feat2_title', desc: 'landing_feat2_desc', tone: 'bg-emerald-50 text-emerald-700' },
  { icon: ICONS.stages, title: 'landing_feat3_title', desc: 'landing_feat3_desc', tone: 'bg-blue-50 text-blue-600' },
  { icon: ICONS.flag, title: 'landing_feat4_title', desc: 'landing_feat4_desc', tone: 'bg-amber-50 text-amber-700' },
  { icon: ICONS.history, title: 'landing_feat5_title', desc: 'landing_feat5_desc', tone: 'bg-slate-100 text-slate-700' },
  { icon: ICONS.upload, title: 'landing_feat6_title', desc: 'landing_feat6_desc', tone: 'bg-slate-100 text-slate-700' },
];

const STEPS: { title: TranslationKey; desc: TranslationKey }[] = [
  { title: 'landing_wf_step1_title', desc: 'landing_wf_step1_desc' },
  { title: 'landing_wf_step2_title', desc: 'landing_wf_step2_desc' },
  { title: 'landing_wf_step3_title', desc: 'landing_wf_step3_desc' },
  { title: 'landing_wf_step4_title', desc: 'landing_wf_step4_desc' },
];

// Static illustration of the dashboard for the hero (not live data).
const PREVIEW_ROWS = [
  { name: 'J. Mugisha', acc: 'ACC-10293', stage: 'Paying', stageTone: 'bg-blue-50 text-blue-700', flag: 'bg-blue-500', bal: '420,000' },
  { name: 'A. Uwase', acc: 'ACC-10418', stage: 'Promise to pay', stageTone: 'bg-amber-50 text-amber-700', flag: 'bg-amber-400', bal: '1,150,000' },
  { name: 'E. Habimana', acc: 'ACC-10577', stage: 'Negotiation', stageTone: 'bg-slate-100 text-slate-700', flag: 'bg-red-500', bal: '2,300,000' },
  { name: 'C. Ingabire', acc: 'ACC-10602', stage: 'Completed', stageTone: 'bg-emerald-50 text-emerald-700', flag: 'bg-emerald-500', bal: '0' },
];

function stripStepNumber(text: string) {
  // Step titles in the translations start with "1. ", the number is shown separately.
  return text.replace(/^\d+\.\s*/, '');
}

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900"
    >
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Logo size={36} variant="icon" className="shrink-0" />
            <BrandWordmark className="flex sm:hidden" />
            <BrandWordmark size="md" className="hidden sm:flex" />
          </div>

          <nav className="hidden lg:flex items-center gap-7 mx-6 text-[13px] font-medium text-slate-600 whitespace-nowrap">
            <a href="#features" className="hover:text-slate-900 transition-colors duration-150">{t('landing_features')}</a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors duration-150">{t('landing_workflow')}</a>
            <a href="#roles" className="hover:text-slate-900 transition-colors duration-150">{t('landing_roles_nav')}</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors duration-150 whitespace-nowrap"
            >
              {t('landing_agent_signin')}
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap"
            >
              {t('landing_launch_portal')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-100 bg-slate-50/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                {t('landing_eyebrow')}
              </p>
              <h1 className="text-[2rem] sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                {t('landing_hero_title_1')}{' '}
                <span className="text-blue-600">{t('landing_hero_title_2')}</span>
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t('landing_hero_desc')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors duration-150"
                >
                  {t('landing_access_workspace')}
                  <Icon d={ICONS.arrow} className="w-4 h-4" />
                </Link>
                <a
                  href="#workflow"
                  className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg font-semibold text-sm transition-colors duration-150"
                >
                  {t('landing_view_workflow')}
                </a>
              </div>

              <ul className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 pt-2 text-xs font-medium text-slate-500">
                {(['landing_trust_roles', 'landing_trust_audit', 'landing_trust_devices'] as TranslationKey[]).map((k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <Icon d={ICONS.check} className="w-3.5 h-3.5 text-emerald-600" />
                    {t(k)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Product preview (illustration) */}
            <div aria-hidden="true" className="hidden md:block">
              <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Logo size={20} variant="icon" />
                    <span className="text-xs font-semibold text-slate-800">{t('landing_preview_label')}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { k: 'landing_preview_files' as TranslationKey, v: '584', tone: 'text-slate-900' },
                      { k: 'landing_preview_recovered' as TranslationKey, v: 'RWF 8.79M', tone: 'text-emerald-700' },
                      { k: 'landing_preview_outstanding' as TranslationKey, v: 'RWF 14.8M', tone: 'text-slate-900' },
                    ].map((m) => (
                      <div key={m.k} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-[10px] font-medium text-slate-500 truncate">{t(m.k)}</p>
                        <p className={`text-sm font-bold tabular-nums mt-1 ${m.tone}`}>{m.v}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1.5">
                      <span>{t('landing_preview_recovered')}</span>
                      <span className="tabular-nums">37%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full w-[37%] rounded-full bg-blue-600" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-100 divide-y divide-slate-100">
                    {PREVIEW_ROWS.map((r) => (
                      <div key={r.acc} className="flex items-center gap-3 px-3 py-2.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${r.flag}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{r.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{r.acc}</p>
                        </div>
                        <span className={`hidden lg:inline px-2 py-0.5 rounded text-[10px] font-semibold ${r.stageTone}`}>
                          {r.stage}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-slate-900 w-20 text-right">{r.bal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Capability strip */}
        <section className="border-b border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-slate-100">
            {[
              { icon: ICONS.stages, v: 'landing_stat_stages_val' as TranslationKey, l: 'landing_stat_stages_lbl' as TranslationKey },
              { icon: ICONS.chat, v: 'landing_stat_whatsapp_val' as TranslationKey, l: 'landing_stat_whatsapp_lbl' as TranslationKey },
              { icon: ICONS.upload, v: 'landing_strip_import' as TranslationKey, l: 'landing_strip_import_lbl' as TranslationKey },
              { icon: ICONS.audit, v: 'landing_strip_audit' as TranslationKey, l: 'landing_strip_audit_lbl' as TranslationKey },
            ].map((c, i) => (
              <div key={c.v} className={`flex items-start gap-3 py-6 px-2 sm:px-5 ${i % 2 === 1 ? 'border-l border-slate-100 lg:border-l-0' : ''} ${i >= 2 ? 'border-t border-slate-100 lg:border-t-0' : ''}`}>
                <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon d={c.icon} className="w-[18px] h-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{t(c.v)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t(c.l)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 scroll-mt-16">
          <div className="max-w-2xl mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">{t('landing_features')}</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{t('landing_features_title')}</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t('landing_features_sub')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200/70 border border-slate-200/70 rounded-xl overflow-hidden">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-6 flex gap-4">
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${f.tone}`}>
                  <Icon d={f.icon} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{t(f.title)}</h3>
                  <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{t(f.desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section id="workflow" className="bg-slate-50 border-y border-slate-100 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="max-w-2xl mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">{t('landing_workflow_badge')}</p>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{t('landing_workflow_title')}</h2>
              <p className="mt-2 text-sm text-slate-500">{t('landing_workflow_sub')}</p>
            </div>

            <ol className="grid md:grid-cols-4 gap-6 md:gap-0">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative md:pr-6">
                  {/* connector line between steps on desktop */}
                  {i < STEPS.length - 1 && (
                    <span className="hidden md:block absolute top-4 left-10 right-0 h-px bg-slate-200" aria-hidden="true" />
                  )}
                  <span
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                      i === STEPS.length - 1 ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">{stripStepNumber(t(s.title))}</h3>
                  <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{t(s.desc)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 scroll-mt-16">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{t('landing_roles_title')}</h2>
            <p className="mt-2 text-sm text-slate-500">{t('landing_roles_sub')}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: ICONS.admin,
                title: 'landing_role_admin_title' as TranslationKey,
                items: ['landing_role_admin_1', 'landing_role_admin_2', 'landing_role_admin_3'] as TranslationKey[],
              },
              {
                icon: ICONS.field,
                title: 'landing_role_coll_title' as TranslationKey,
                items: ['landing_role_coll_1', 'landing_role_coll_2', 'landing_role_coll_3'] as TranslationKey[],
              },
            ].map((r) => (
              <div key={r.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon d={r.icon} />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">{t(r.title)}</h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {r.items.map((k) => (
                    <li key={k} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Icon d={ICONS.check} className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      {t(k)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 sm:px-6 pb-16 md:pb-20">
          <div className="max-w-7xl mx-auto rounded-xl bg-slate-900 px-6 py-10 md:px-12 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">{t('landing_cta_title')}</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{t('landing_cta_sub')}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors duration-150 shrink-0"
            >
              {t('landing_cta_btn')}
              <Icon d={ICONS.arrow} className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Logo size={30} variant="icon" />
              <BrandWordmark />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{t('landing_hero_badge')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">{t('landing_footer_product')}</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li><a href="#features" className="hover:text-slate-900 transition-colors duration-150">{t('landing_features')}</a></li>
              <li><a href="#workflow" className="hover:text-slate-900 transition-colors duration-150">{t('landing_workflow')}</a></li>
              <li><Link href="/login" className="hover:text-slate-900 transition-colors duration-150">{t('landing_agent_signin')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">{t('landing_footer_legal')}</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li><Link href="/privacy" className="hover:text-slate-900 transition-colors duration-150">{t('landing_privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-slate-900 transition-colors duration-150">{t('landing_terms')}</Link></li>
              <li><Link href="/security" className="hover:text-slate-900 transition-colors duration-150">{t('landing_security')}</Link></li>
              <li><Link href="/data-deletion" className="hover:text-slate-900 transition-colors duration-150">{t('landing_data_deletion')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <p className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-[11px] text-slate-500">
            © {new Date().getFullYear()} Bureau of Debt Collection Agency Ltd. {t('landing_rights')}
          </p>
        </div>
      </footer>
    </div>
  );
}
