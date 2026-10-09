import Link from 'next/link';
import Logo from '@/components/Logo';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={32} variant="icon" className="shrink-0 drop-shadow-sm" />
            <span className="font-bold text-slate-900 text-sm">Recovery Credit</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition">Home</Link>
            <Link href="/privacy" className="hover:text-blue-600 transition">Privacy</Link>
            <Link href="/login" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 space-y-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Legal Agreement</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Terms of Service & Code of Conduct</h1>
            <p className="text-xs text-slate-500 mt-2">Mandatory Terms for Authorized Recovery Officers & System Users</p>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-600 space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">1. Acceptance & Authorization</h2>
              <p>
                By checking the mandatory authorization checkbox and signing into Recovery Credit 6, you affirm that you are an accredited debt collector, legal representative, or authorized agent of the creditor institution. Unauthorized access or transmission of debtor records is strictly prohibited and constitutes an offence under cybercrime legislation.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">2. Ethical Debt Collection Guidelines</h2>
              <p>Every system operator must adhere to the Statutory Debt Collection Code of Conduct:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>No harassment, abusive communication, or misrepresentation of statutory authority.</li>
                <li>WhatsApp reminders and telephone calls may only be initiated during authorized business hours (08:00 to 19:00 weekdays).</li>
                <li>Settlement agreements, promise-to-pay pledges, and waiver concessions must be truthfully documented in the activity audit log.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">3. Non-Disclosure & Confidentiality</h2>
              <p>
                Debtor financial files, employer details uncovered via skip tracing, and banking data constitute strictly classified proprietary material. Exporting data for personal use or sharing credentials is grounds for immediate credential revocation and criminal reporting.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">4. Continuous Session Auditing</h2>
              <p>
                All account creations, CSV data imports, payments recorded, and debtors marked for skip-tracing are permanently watermarked with your operator identifier, IP address, and server timestamp.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">5. Termination of Access</h2>
              <p>
                Recovery Credit 6 reserves the unilateral right to suspend access immediately upon detection of anomalous bulk downloads, suspicious geographic login attempts, or violations of privacy legislation.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
