'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SecurityPage() {
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} variant="icon" className="shrink-0 drop-shadow-sm" />
            <span className="font-bold text-slate-900 text-sm">{t('app_name')}</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <LanguageSwitcher />
            <Link href="/" className="hover:text-blue-600 transition">{t('legal_home')}</Link>
            <Link href="/privacy" className="hover:text-blue-600 transition">{t('legal_privacy')}</Link>
            <Link href="/login" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              {t('legal_signin')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 space-y-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              {language === 'rw' ? 'Imiterere y’Umutekano' : 'Defense Architecture'}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {language === 'rw' ? 'Amabwiriza n’Ingamba by’Umutekano' : 'Security & Protection Protocols'}
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              {language === 'rw' ? 'Uburinzi Bukomeye bwo Ku rwego rw’Inganda bw’Amadosiye y’Imyenda' : 'Enterprise-Grade Technical Safeguards for Debt Recovery Portfolios'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'rw' ? 'Gukumira Ibitero by’Ubwinjiriro' : 'Brute-Force Attack Prevention'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'rw'
                  ? 'Sisitemu ihagarika ako kanya konti igerageje kwinjira inshuro 5 zikurikirana idatsinze, ikayifunga by’agateganyo.'
                  : 'Automated threshold enforcement locks access after 5 consecutive failed authorization attempts with a mandatory cooldown period.'}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'rw' ? 'Gusaba Kwemeza Amategeko Byanze Bikunze' : 'Mandatory Terms Acceptance'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'rw'
                  ? 'Kugenzura ko nta mukozi ushobora kureba amadosiye y’abafite imyenda atabanje kwemeza ku mugaragaro ko yemera amabwiriza.'
                  : 'Strict client-side and server-side verification ensuring operators cannot view confidential debtor balances without active certification.'}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'rw' ? 'Kwitandukanya k’Ubwinjiriro (Session Isolation)' : 'Session Isolation & Guarding'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'rw'
                  ? 'Amapaji yose y’imbere arinzwe na AuthGuards ibuza kwinjira ku buryo bwa roho idafite uruhushya rwemejwe.'
                  : 'Every internal route is wrapped in reactive AuthGuards preventing deep linking into debtor files without verified sessions.'}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'rw' ? 'Inyandiko z’Ibikorwa Zidasibwa (Audit Logs)' : 'Immutable Audit Logs'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'rw'
                  ? 'Buri nyandiko yo kwishyura, igikorwa, n’ihindurwa ry’amafaranga bihuzwa burundu n’umukozi wayikoze hamwe n’igihe nyacyo.'
                  : 'Every payment entry, activity log, and balance adjustment is permanently linked to the originating agent and timestamped.'}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 text-xs text-slate-500">
            {language === 'rw'
              ? 'Niba ubonye intege nke z’umutekano cyangwa ufite ikibazo, twandikire kuri '
              : 'For security disclosures or vulnerability reports, please reach out to our team at '}
            <span className="font-semibold text-slate-700">security@recoverycredit.internal</span>.
          </div>
        </div>
      </main>
    </div>
  );
}
