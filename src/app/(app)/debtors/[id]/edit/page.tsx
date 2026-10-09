'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDebtor, updateDebtor } from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';
import DebtorFormFields from '@/components/DebtorFormFields';
import type { Debtor } from '@/lib/types';

export default function EditDebtorPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const id = params.id as string;

  const [debtor, setDebtor] = useState<Debtor | null>(null);

  useEffect(() => {
    const d = getDebtor(id);
    setDebtor(d);
  }, [id]);

  if (!debtor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-semibold text-slate-700">{t('detail_not_found')}</h2>
        <button onClick={() => router.push('/debtors')} className="mt-3 text-xs text-rose-600 hover:underline">
          {t('detail_return_list')}
        </button>
      </div>
    );
  }

  const handleSubmit = (data: any) => {
    updateDebtor(id, data);
    router.push(`/debtors/${id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('form_edit_title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{debtor.clientName} ({debtor.accountNumber})</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          {t('form_cancel')}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <DebtorFormFields onSubmit={handleSubmit} debtor={debtor} isEdit={true} />
      </div>
    </div>
  );
}
