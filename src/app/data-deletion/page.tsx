'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const emptySubscribe = () => () => {};

export default function DataDeletionPage() {
  const { t, language } = useLanguage();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

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
            <Link href="/terms" className="hover:text-blue-600 transition">{t('legal_terms')}</Link>
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
              {language === 'rw' ? 'Gusiba Amakuru' : 'User Data Deletion'}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {language === 'rw' ? 'Amabwiriza yo Gusaba Gusiba Amakuru' : 'User Data Deletion Instructions'}
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              {language === 'rw' 
                ? 'Amabwiriza yo gusiba amakuru akurikije amategeko ya Meta Platform na GDPR / POPIA' 
                : 'Instructions for requesting user data removal in accordance with Meta Platform Terms, GDPR, and POPIA'}
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-600 space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                1. Overview & Rights to Deletion
              </h2>
              <p>
                In compliance with the Meta Platform Terms, General Data Protection Regulation (GDPR), and Protection of Personal Information Act (POPIA), Recovery Credit provides users and data subjects with the right to request the deletion or anonymization of personal data collected through our services, integrations, or messaging channels (such as WhatsApp Business Cloud API).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                2. How to Request Data Deletion
              </h2>
              <p>
                If you wish to have your personal data, phone number, communication records, or account access removed from our systems, please follow these steps:
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <div>
                    <strong className="text-slate-800">Submit a Written Request:</strong> Send an email from your registered email address to our Data Governance Office at <span className="font-semibold text-blue-600">compliance@recoverycredit.internal</span> (or <span className="font-semibold text-blue-600">privacy@recoverycredit.internal</span>).
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <div>
                    <strong className="text-slate-800">Include Identifying Details:</strong> Specify your Full Legal Name, Phone Number (associated with WhatsApp communication), Customer/Account Number (if applicable), and include the subject line: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Data Deletion Request - Meta Platform</code>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <div>
                    <strong className="text-slate-800">Verification & Processing:</strong> Our compliance team will acknowledge receipt within 48 hours, verify your identity, and complete data sanitization within thirty (30) calendar days.
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                3. Statutory Retention Exemptions
              </h2>
              <p>
                Please note that under the National Credit Act (NCA) and financial regulatory statutory mandates, certain transactional records, acknowledgement of debt agreements, and payment dispute histories must be maintained for statutory accounting audit periods. Any non-statutory personal identifiers will be permanently redacted upon request.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                4. Confirmation Receipt
              </h2>
              <p>
                Upon completion of the deletion process, an official Cryptographic Deletion Confirmation will be issued to your contact email with a unique tracking ID verifying that all associated personal data has been securely purged.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
