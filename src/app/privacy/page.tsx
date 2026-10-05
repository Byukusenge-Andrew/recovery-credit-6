import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              RC6
            </div>
            <span className="font-bold text-slate-900 text-sm">Recovery Credit 6</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition">Home</Link>
            <Link href="/terms" className="hover:text-blue-600 transition">Terms</Link>
            <Link href="/login" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 space-y-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Statutory Notice</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Privacy Notice & Data Protection Policy</h1>
            <p className="text-xs text-slate-500 mt-2">Effective Date: October 2026 • Version 2.4</p>
          </div>

          <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-600 space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">1. Regulatory Compliance Framework</h2>
              <p>
                Recovery Credit 6 operates under strict compliance with the Protection of Personal Information Act (POPIA), National Credit Act (NCA), and international data privacy benchmarks. We recognize the sensitive nature of debtor financial records and maintain bank-grade confidentiality across all processing operations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">2. Categories of Information Processed</h2>
              <p>In executing lawful debt recovery operations, we process:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Debtor Identification Data:</strong> Full legal names, national identity numbers, customer account IDs, and verified residential addresses.</li>
                <li><strong>Financial & Obligation Data:</strong> Original credit facility amounts, interest accrued, payment histories, outstanding balances, and banking institution references.</li>
                <li><strong>Communication & Recovery Logs:</strong> Timestamped records of WhatsApp reminders, phone discussions, waiver letters, and signed acknowledgement of debt (AOD) agreements.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">3. Lawful Basis and Purpose of Processing</h2>
              <p>
                All personal and financial information is processed solely for lawful debt reconciliation, enforcement of contractual agreements between lending institutions and debtors, and legal compliance. We do not sell, license, or monetize debtor records to third-party marketing brokers under any circumstances.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">4. Data Security & Storage Controls</h2>
              <p>
                Data is encrypted in transit using Transport Layer Security (TLS 1.3) and at rest utilizing AES-256 encryption. Access permissions are strictly managed through role-based privileges with multi-factor authentication requirements for recovery officers and administrative staff.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">5. Retention & Disposal Schedule</h2>
              <p>
                Debtor records are retained only for the duration stipulated by statutory prescription periods or applicable credit regulations, after which secure cryptographic sanitization is performed.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">6. Contact Our Information Officer</h2>
              <p>
                For data subject access requests, dispute submissions, or questions regarding our information handling practices, contact our Data Governance Office at <span className="font-semibold text-slate-800">compliance@recoverycredit6.internal</span>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
