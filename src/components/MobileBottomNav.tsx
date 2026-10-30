'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageContext';

interface MobileBottomNavProps {
  onOpenQuickPay: () => void;
  onOpenDrawer: () => void;
}

export default function MobileBottomNav({ onOpenQuickPay, onOpenDrawer }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isDashboard = pathname === '/dashboard';
  const isDebtors = pathname.startsWith('/debtors');
  const isInstitutions = pathname.startsWith('/institutions');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pt-1.5 pb-3 md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-5 items-center max-w-lg mx-auto">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isDashboard ? 'text-[#0c2340] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isDashboard ? 2.2 : 1.75}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span className="text-[10px] leading-tight">{t('nav_dashboard')}</span>
        </Link>

        {/* Debtors */}
        <Link
          href="/debtors"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isDebtors ? 'text-[#0c2340] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isDebtors ? 2.2 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
          </svg>
          <span className="text-[10px] leading-tight">{t('nav_debtors')}</span>
        </Link>

        {/* Center Quick Collect Action */}
        <div className="flex flex-col items-center justify-center -mt-4">
          <button
            type="button"
            onClick={onOpenQuickPay}
            aria-label="Record Payment"
            className="w-12 h-12 rounded-full bg-[#15803d] hover:bg-[#166534] active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20 transition-all border-2 border-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <span className="text-[9.5px] font-semibold text-[#15803d] mt-1 leading-tight">Pay</span>
        </div>

        {/* Institutions */}
        <Link
          href="/institutions"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isInstitutions ? 'text-[#0c2340] font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isInstitutions ? 2.2 : 1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A48.243 48.243 0 0012 9.75c-2.551 0-5.056.2-7.5.583V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
          </svg>
          <span className="text-[10px] leading-tight">{t('nav_institutions')}</span>
        </Link>

        {/* Menu / Drawer Toggle */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open Navigation Drawer"
          className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <span className="text-[10px] leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
