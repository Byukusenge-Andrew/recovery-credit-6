'use client';

import { useState, useEffect } from 'react';
import { Debtor, Category, ColorFlag, User } from '@/lib/types';
import { CATEGORIES, COLOR_FLAGS } from '@/lib/constants';
import { getCollectors, getCurrentUser } from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';

export interface DebtorFormData {
  accountNumber: string;
  customerId: string;
  debtorName: string;       // Bank client (Debtor)
  clientName: string;       // Bank (Client)
  outstandingAmount: number;
  paidAmount: number;
  dateOfPayment: string;
  whatsappNumber: string;
  category: Category;
  colorFlag: ColorFlag;
  assignedCollector: string;
  notes: string;
}

interface Props {
  debtor?: Debtor;
  onSubmit: (data: DebtorFormData) => void;
  isEdit?: boolean;
}

export default function DebtorFormFields({ debtor, onSubmit, isEdit = false }: Props) {
  const { t } = useLanguage();
  const collectors = getCollectors();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const isCollector = currentUser?.role === 'collector';

  const [formData, setFormData] = useState<DebtorFormData>({
    accountNumber: debtor?.accountNumber || '',
    customerId: debtor?.customerId || '',
    debtorName: debtor?.debtorName || (debtor as any)?.clientName || '',
    clientName: debtor?.clientName || '',
    outstandingAmount: debtor?.outstandingAmount || 0,
    paidAmount: debtor?.paidAmount || 0,
    dateOfPayment: debtor?.dateOfPayment || '',
    whatsappNumber: debtor?.whatsappNumber || '',
    category: debtor?.category || CATEGORIES[0].value,
    colorFlag: debtor?.colorFlag || 'none',
    assignedCollector: debtor?.assignedCollector || '',
    notes: debtor?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const balance = (formData.outstandingAmount || 0) - (formData.paidAmount || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('form_client_name')}
          </label>
          <input
            type="text"
            name="clientName"
            required
            disabled={isCollector}
            placeholder="e.g. Standard Bank, Absa, Nedbank, FNB..."
            value={formData.clientName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            {t('form_debtor_name')}
          </label>
          <input
            type="text"
            name="debtorName"
            required
            disabled={isCollector}
            placeholder="Full name of bank client with outstanding balance..."
            value={formData.debtorName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_account_num')}</label>
          <input
            type="text"
            name="accountNumber"
            required
            disabled={isCollector}
            placeholder="Bank account number"
            value={formData.accountNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_cust_id')}</label>
          <input
            type="text"
            name="customerId"
            disabled={isCollector}
            placeholder="Customer ID or National ID"
            value={formData.customerId}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_outstanding')}</label>
          <input
            type="number"
            step="0.01"
            name="outstandingAmount"
            required
            disabled={isCollector}
            value={formData.outstandingAmount}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_paid')}</label>
          <input
            type="number"
            step="0.01"
            name="paidAmount"
            value={formData.paidAmount}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_balance')}</label>
          <input
            type="number"
            readOnly
            value={balance}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-bold"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_due_date')}</label>
          <input
            type="date"
            name="dateOfPayment"
            value={formData.dateOfPayment}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_whatsapp')}</label>
          <input
            type="tel"
            name="whatsappNumber"
            placeholder="+27..."
            value={formData.whatsappNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_collector')}</label>
          {collectors.length > 0 ? (
            <select
              name="assignedCollector"
              value={formData.assignedCollector}
              onChange={handleChange}
              disabled={isCollector}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <option value="">{t('form_unassigned')}</option>
              {collectors.map(c => (
                <option key={c.username} value={c.username}>{c.fullName} ({c.username})</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="assignedCollector"
              disabled={isCollector}
              placeholder="e.g. Agent name or ID (optional)"
              value={formData.assignedCollector}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          )}
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_category')}</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{t(`cat_${cat.value}` as any) || cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">{t('form_flag')}</label>
          <select
            name="colorFlag"
            value={formData.colorFlag}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            {COLOR_FLAGS.map(flag => (
              <option key={flag.value} value={flag.value}>{t(`flag_${flag.value}` as any) || flag.label}</option>
            ))}
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block font-medium text-slate-700 mb-1">{t('form_notes')}</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Additional case background, employment details, skip-tracing notes..."
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
        >
          {isEdit ? t('form_update_btn') : t('form_save_btn')}
        </button>
      </div>
    </form>
  );
}
