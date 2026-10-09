'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function PrivacyPage() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} variant="icon" className="shrink-0 drop-shadow-sm" />
            <span className="font-bold text-slate-900 text-sm">{t('app_name')}</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <LanguageSwitcher />
            <Link href="/" className="hover:text-blue-600 transition">{t('legal_home')}</Link>
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
              {language === 'rw' ? 'Itangazo ry’Amategeko' : 'Statutory Notice'}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {language === 'rw' ? 'Amategeko yo Kurinda Amakuru n’Umutekano' : 'Privacy Notice & Data Protection Policy'}
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              {language === 'rw' ? 'Yatangiye gukurikizwa: Ukwakira 2026 • Verisiyo 2.4' : 'Effective Date: October 2026 • Version 2.4'}
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-600 space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '1. Kubahiriza Amategeko agenga Amakuru' : '1. Regulatory Compliance Framework'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Recovery Credit ikora yubahiriza amategeko yo kurinda amakuru bwite (POPIA/Data Protection), amategeko agenga inguzanyo, n’amabwiriza mpuzamahanga. Tuzi agaciro k’amakuru y’umwenda n’imari, bityo dukoresha ubwirinzi buhambaye bwa banki mu bikorwa byose byo gucunga no kwishyuza.'
                  : 'Recovery Credit operates under strict compliance with the Protection of Personal Information Act (POPIA), National Credit Act (NCA), and international data privacy benchmarks. We recognize the sensitive nature of debtor financial records and maintain bank-grade confidentiality across all processing operations.'}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '2. Amoko y’Amakuru Akusanywa' : '2. Categories of Information Processed'}
              </h2>
              <p>{language === 'rw' ? 'Mu bikorwa byemewe n’amategeko byo kwishyuza, dukoresha:' : 'In executing lawful debt recovery operations, we process:'}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>{language === 'rw' ? 'Imyirondoro y’Ufite Umwenda:' : 'Debtor Identification Data:'}</strong>{' '}
                  {language === 'rw' ? 'Amazina yose, nomero z’indangamuntu, ID za konti, n’aho atuye.' : 'Full legal names, national identity numbers, customer account IDs, and verified residential addresses.'}
                </li>
                <li>
                  <strong>{language === 'rw' ? 'Amakuru y’Imari n’Imyenda:' : 'Financial & Obligation Data:'}</strong>{' '}
                  {language === 'rw' ? 'Amafaranga y’umwenda w’umwimerere, inyungu, inyandiko z’ubwishyu bwabanje, ibirarane, n’amabanki bakorana.' : 'Original credit facility amounts, interest accrued, payment histories, outstanding balances, and banking institution references.'}
                </li>
                <li>
                  <strong>{language === 'rw' ? 'Inyandiko z’Itumanaho:' : 'Communication & Recovery Logs:'}</strong>{' '}
                  {language === 'rw' ? 'Ubutumwa bwa WhatsApp, telefone, inyandiko z’imbabazi, n’amasezerano y’ubwishyu yashyizweho umukono.' : 'Timestamped records of WhatsApp reminders, phone discussions, waiver letters, and signed acknowledgement of debt (AOD) agreements.'}
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '3. Intego yo Gukoresha Amakuru' : '3. Lawful Basis and Purpose of Processing'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Amakuru yose akoreshwa gusa mu bikorwa byemewe byo kugaruza inguzanyo no kubahiriza amasezerano yagiranye na banki cyangwa ikigo cy’imari. Ntitugurisha cyangwa ngo dusangize amakuru y’abafite imyenda ibindi bigo byo kwamamaza.'
                  : 'All personal and financial information is processed solely for lawful debt reconciliation, enforcement of contractual agreements between lending institutions and debtors, and legal compliance. We do not sell, license, or monetize debtor records to third-party marketing brokers under any circumstances.'}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '4. Umutekano w’Amakuru n’Ububiko' : '4. Data Security & Storage Controls'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Amakuru acungirwa umutekano hakoreshejwe TLS 1.3 mu ihererekanya, na AES-256 mu bubiko. Uburenganzira bwo kuyareba buhabwa abakozi babifitiye uburenganzira gusa.'
                  : 'Data is encrypted in transit using Transport Layer Security (TLS 1.3) and at rest utilizing AES-256 encryption. Access permissions are strictly managed through role-based privileges with multi-factor authentication requirements for recovery officers and administrative staff.'}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '5. Kubika no Gusiba Amakuru' : '5. Retention & Disposal Schedule'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Amakuru abikwa igihe giteganywa n’amategeko agenga inguzanyo, nyuma yaho agasibwa mu buryo budasubirwaho kandi bwizewe.'
                  : 'Debtor records are retained only for the duration stipulated by statutory prescription periods or applicable credit regulations, after which secure cryptographic sanitization is performed.'}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'rw' ? '6. Kutwandikira' : '6. Contact Our Information Officer'}
              </h2>
              <p>
                {language === 'rw'
                  ? 'Niba ufite ikibazo cyangwa ushaka kumenya byinshi ku makuru yawe, twandikire ku biro bishinzwe amategeko: '
                  : 'For data subject access requests, dispute submissions, or questions regarding our information handling practices, contact our Data Governance Office at '}
                <span className="font-semibold text-slate-800">compliance@recoverycredit.internal</span>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
