'use client';

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/store';
import { useState, useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useSyncExternalStore(
    subscribe,
    () => getCurrentUser(),
    () => null
  );
  const username = currentUser?.username ?? 'Admin';
  const isAdmin = currentUser?.role === 'admin';
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50/50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
          {/* Hamburger + Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              aria-label="Toggle Navigation Menu"
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
              title="Toggle Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Logo size={34} variant="icon" className="shrink-0 drop-shadow-sm" />
              <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:inline">
                Recovery Credit
              </span>
            </Link>
          </div>

          {/* Search bar pill */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search debtors, accounts, banks..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    router.push(`/debtors?search=${(e.target as HTMLInputElement).value}`);
                  }
                }}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-transparent rounded-full text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-colors"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Admin Add Debtor Shortcut */}
            {isAdmin && (
              <Link
                href="/debtors/add"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-sm flex items-center gap-1.5"
              >
                <span>+</span>
                <span className="hidden sm:inline">New Debtor</span>
              </Link>
            )}

            {/* Profile Avatar & Link */}
            <Link
              href="/profile"
              title="My Profile & Settings"
              className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold tracking-wider border border-blue-200 transition uppercase shadow-sm"
            >
              {username.substring(0, 2)}
            </Link>
          </div>
        </header>

        {/* Sidebar */}
        <Sidebar expanded={sidebarExpanded} />

        {/* Main Content */}
        <main
          className={`pt-16 min-h-screen transition-all duration-200 ${
            sidebarExpanded ? 'pl-56' : 'pl-16'
          }`}
        >
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
