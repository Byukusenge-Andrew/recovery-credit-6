'use client';

import { useRouter } from 'next/navigation';
import { addDebtor } from '@/lib/store';
import DebtorFormFields from '@/components/DebtorFormFields';

export default function AddDebtorPage() {
  const router = useRouter();

  const handleSubmit = (data: any) => {
    addDebtor(data);
    router.push('/debtors');
  };

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
