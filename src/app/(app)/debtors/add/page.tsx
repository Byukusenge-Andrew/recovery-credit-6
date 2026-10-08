'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addDebtor, getCurrentUser } from '@/lib/store';
import DebtorFormFields from '@/components/DebtorFormFields';
import type { User } from '@/lib/types';

export default function AddDebtorPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  useEffect(() => {
    setIsClientLoaded(true);
    const u = getCurrentUser();
    setCurrentUser(u);
  }, []);

  const handleSubmit = (data: any) => {
    addDebtor(data);
    router.push('/debtors');
  };

  if (isClientLoaded && currentUser?.role === 'collector') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Administrator Access Required</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Adding new debtor accounts and allocating them to collectors is managed by System Administrators.
        </p>
        <Link
          href="/debtors"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
        >
          Return to My Debtors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Debtor</h1>
          <p className="text-sm text-slate-500 mt-0.5">Register a new client or debtor file.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <DebtorFormFields onSubmit={handleSubmit} isEdit={false} />
      </div>
    </div>
  );
}
