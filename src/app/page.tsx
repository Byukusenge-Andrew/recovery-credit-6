import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Header / Nav */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} variant="icon" className="shrink-0 drop-shadow-sm" />
            <span className="font-extrabold text-slate-900 text-base tracking-tight">Recovery Credit</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#security" className="hover:text-blue-600 transition">Security & Compliance</a>
            <a href="#workflow" className="hover:text-blue-600 transition">Debt Recovery</a>
            <Link href="/privacy" className="hover:text-blue-600 transition">Privacy Notice</Link>
            <Link href="/terms" className="hover:text-blue-600 transition">Terms of Service</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Agent Sign In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              Launch Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Bank-Grade Debt Portfolio & Recovery Management
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Modern, Compliant & Intelligent <span className="text-blue-600">Credit Recovery</span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Manage debtors, reconcile bank accounts, automate WhatsApp reminders, track promise-to-pay commitments, and execute skip-tracing with strict regulatory compliance.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-sm"
            >
              Access Recovery Workspace
            </Link>
            <Link
              href="/security"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition shadow-sm"
            >
              View Security Protocols
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metrics / Highlights */}
      <section className="py-12 border-y border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-extrabold text-slate-900">100%</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Audit Trail Logging</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-blue-600">8 Stages</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Lifecycle Recovery Pipeline</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">AES-256</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Encrypted Data at Rest</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-emerald-600">POPIA & NCA</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Statutory Compliance</p>
          </div>
        </div>
      </section>

      {/* Core Modules Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Engineered for Credit Agencies & Financial Institutions
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2">
            Complete tools to handle every aspect of modern collection workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Debtor Portfolio Reconciliation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time synchronization of original claim balance, payments received, and net amounts due with multi-bank tagging.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">WhatsApp Payment Reminders</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant notification deep links dispatch pre-configured, personalized reminders containing accurate balance calculations.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Lifecycle Classification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Granular workflows for Promise to Pay, Waiver Letters, Disputed Claims, Negotiations, and Skip Tracing with color flags.
            </p>
          </div>
        </div>
      </section>

      {/* Security Assurance Banner */}
      <section id="security" className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200/80 p-8 md:p-12 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                Enterprise Data Protection
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                Rigorous Security & Statutory Accountability
              </h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                Every debtor file, payment record, and communication history is strictly guarded with brute-force defense, rate limiting, and encrypted session security.
              </p>
            </div>
            <Link
              href="/security"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-sm"
            >
              Security Policy →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <Logo size={26} variant="icon" className="shrink-0" />
            <span className="font-bold text-slate-800">Recovery Credit</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition">Privacy Notice</Link>
            <Link href="/terms" className="hover:text-slate-900 transition">Terms of Service</Link>
            <Link href="/security" className="hover:text-slate-900 transition">Security Measures</Link>
            <Link href="/login" className="hover:text-slate-900 transition font-medium text-blue-600">Agent Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
