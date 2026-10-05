import Link from 'next/link';

export default function SecurityPage() {
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
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Defense Architecture</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Security & Protection Protocols</h1>
            <p className="text-xs text-slate-500 mt-2">Enterprise-Grade Technical Safeguards for Debt Recovery Portfolios</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900">Brute-Force Attack Prevention</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated threshold enforcement locks access after 5 consecutive failed authorization attempts with a mandatory cooldown period.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900">Mandatory Terms Acceptance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict client-side and server-side verification ensuring operators cannot view confidential debtor balances without active certification.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900">Session Isolation & Guarding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every internal route is wrapped in reactive AuthGuards preventing deep linking into debtor files without verified sessions.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="text-sm font-bold text-slate-900">Immutable Audit Logs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every payment entry, activity log, and balance adjustment is permanently linked to the originating agent and timestamped.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 text-xs text-slate-500">
            For security disclosures or vulnerability reports, please reach out to our team at <span className="font-semibold text-slate-700">security@recoverycredit6.internal</span>.
          </div>
        </div>
      </main>
    </div>
  );
}
