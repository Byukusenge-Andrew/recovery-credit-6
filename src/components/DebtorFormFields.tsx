'use client';

import { useState } from 'react';
import { Debtor, Category, ColorFlag } from '@/lib/types';
import { CATEGORIES, COLOR_FLAGS } from '@/lib/constants';
import { getCollectors } from '@/lib/store';

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
  const collectors = getCollectors();

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
            Client (Bank Name) *
          </label>
          <input
            type="text"
            name="clientName"
            required
            placeholder="e.g. Standard Bank, Absa, Nedbank, FNB..."
            value={formData.clientName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Debtor Name (Bank Client) *
          </label>
          <input
            type="text"
            name="debtorName"
            required
            placeholder="Full name of bank client with outstanding balance..."
            value={formData.debtorName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Account Number *</label>
          <input
            type="text"
            name="accountNumber"
            required
            placeholder="Bank account number"
            value={formData.accountNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Customer ID / CIF</label>
          <input
            type="text"
            name="customerId"
            placeholder="Customer ID or National ID"
            value={formData.customerId}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Outstanding Amount (Total Claim) *</label>
          <input
            type="number"
            step="0.01"
            name="outstandingAmount"
            required
            value={formData.outstandingAmount}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Paid Amount (Recovered so far)</label>
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
          <label className="block font-medium text-slate-700 mb-1">Net Outstanding Balance</label>
          <input
            type="number"
            readOnly
            value={balance}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-bold"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Payment Due Date</label>
          <input
            type="date"
            name="dateOfPayment"
            value={formData.dateOfPayment}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">WhatsApp Number</label>
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
          <label className="block font-medium text-slate-700 mb-1">Assigned Recovery Officer (Collector)</label>
          {collectors.length > 0 ? (
            <select
              name="assignedCollector"
              value={formData.assignedCollector}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="">Unassigned</option>
              {collectors.map(c => (
                <option key={c.username} value={c.username}>{c.fullName} ({c.username})</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="assignedCollector"
              placeholder="e.g. Agent name or ID (optional)"
              value={formData.assignedCollector}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          )}
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Recovery Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Priority Color Flag</label>
          <select
            name="colorFlag"
            value={formData.colorFlag}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            {COLOR_FLAGS.map(flag => (
              <option key={flag.value} value={flag.value}>{flag.label}</option>
            ))}
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block font-medium text-slate-700 mb-1">Notes / Case Summary</label>
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
          {isEdit ? 'Update Debtor Information' : 'Save Debtor File'}
        </button>
      </div>
    </form>
  );
}
