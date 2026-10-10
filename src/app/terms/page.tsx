'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TermsPage() {
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
              {language === 'rw' ? 'Amasezerano n’Amategeko' : 'Legal Agreement'}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {language === 'rw' ? 'Amabwiriza y’Imikoreshereze n’Imyitwarire' : 'Terms of Service & Code of Conduct'}
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              {language === 'rw' ? 'Amabwiriza Agomba Kubahirizwa n’Abakozi Bishyuza Imyenda' : 'Mandatory Terms for Authorized Recovery Officers & System Users'}
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-600 space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '1. Kwemera Amasezerano n’Uburenganzira' : '1. Acceptance & Authorization'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Iyo winjiye muri sisitemu ya Recovery Credit, uba wemeje ko uri umukozi wemewe ushinzwe kwishyuza cyangwa uhagarariye ikigo cy’imari cyemewe. Kwinjira bitemewe cyangwa gukwirakwiza amadosiye y’abafite imyenda birabujijwe kandi bihanwa n’amategeko.'
                  : 'By checking the mandatory authorization checkbox and signing into Recovery Credit, you affirm that you are an accredited debt collector, legal representative, or authorized agent of the creditor institution. Unauthorized access or transmission of debtor records is strictly prohibited and constitutes an offence under cybercrime legislation.'}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '2. Amahame y’Imyitwarire Myiza mu Kwishyuza' : '2. Ethical Debt Collection Guidelines'}
              </h2>
              <p>{language === 'rw' ? 'Buri mukozi agomba kubahiriza amabwiriza yo kwishyuza:' : 'Every system operator must adhere to the Statutory Debt Collection Code of Conduct:'}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  {language === 'rw' ? 'Guhagarika ibikorwa byose byo kubangamira cyangwa gutuka abakiriya.' : 'No harassment, abusive communication, or misrepresentation of statutory authority.'}
                </li>
                <li>
                  {language === 'rw' ? 'Gukoresha WhatsApp na telefone mu masaha yemewe gusa (08:00 kugeza 19:00 ku minsi y’akazi).' : 'WhatsApp reminders and telephone calls may only be initiated during authorized business hours (08:00 to 19:00 weekdays).'}
                </li>
                <li>
                  {language === 'rw' ? 'Kwandika mu buryo bwa nyabwo amasezerano yose y’ubwishyu n’ibiganiro byabaye mu nyandiko z’ibikorwa.' : 'Settlement agreements, promise-to-pay pledges, and waiver concessions must be truthfully documented in the activity audit log.'}
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '3. Kutamena Ibanga' : '3. Non-Disclosure & Confidentiality'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Amadosiye y’abafite imyenda, amakuru y’aho bakora, n’imibare ya konti zabo ni ibanga rikomeye. Gusohora aya makuru ngo uyakoreshe ku giti cyawe bishyira mu kaga akazi kawe kandi bishobora gukurikiranwa n’amategeko.'
                  : 'Debtor financial files, employer details uncovered via skip tracing, and banking data constitute strictly classified proprietary material. Exporting data for personal use or sharing credentials is grounds for immediate credential revocation and criminal reporting.'}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '4. Kugenzura Ibyakozwe muri Sisitemu' : '4. Continuous Session Auditing'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Kurema amadosiye mashya, kwinjiza amakuru muri CSV, kwandika ubwishyu bwabonetse, cyangwa guhindura amadosiye byose birandikwa hamwe na aderesi ya IP y’umukozi n’igihe yabikoreye.'
                  : 'All account creations, CSV data imports, payments recorded, and debtors marked for skip-tracing are permanently watermarked with your operator identifier, IP address, and server timestamp.'}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '5. Guhagarikirwa Uburenganzira' : '5. Termination of Access'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Recovery Credit ifite uburenganzira bwo guhagarika konti y’umukozi igihe cyose agaragaje imyitwarire iteye amakenga yo gukura amakuru menshi icyarimwe cyangwa kwinjira mu buryo butemewe.'
                  : 'Recovery Credit reserves the unilateral right to suspend access immediately upon detection of anomalous bulk downloads, suspicious geographic login attempts, or violations of privacy legislation.'}
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
