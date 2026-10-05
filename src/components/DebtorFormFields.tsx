'use client';

import { useState } from 'react';
import { Debtor, Category, ColorFlag } from '@/lib/types';
import { CATEGORIES, COLOR_FLAGS } from '@/lib/constants';

export interface DebtorFormData {
  accountNumber: string;
  customerId: string;
  clientName: string;
  bankName: string;
  outstandingAmount: number;
  paidAmount: number;
  dateOfPayment: string;
  whatsappNumber: string;
  category: Category;
  colorFlag: ColorFlag;
  notes: string;
}

interface Props {
  debtor?: Debtor;
  onSubmit: (data: DebtorFormData) => void;
  isEdit?: boolean;
}

export default function DebtorFormFields({ debtor, onSubmit, isEdit = false }: Props) {
  const [formData, setFormData] = useState<DebtorFormData>({
    accountNumber: debtor?.accountNumber || '',
    customerId: debtor?.customerId || '',
    clientName: debtor?.clientName || '',
    bankName: debtor?.bankName || '',
    outstandingAmount: debtor?.outstandingAmount || 0,
    paidAmount: debtor?.paidAmount || 0,
    dateOfPayment: debtor?.dateOfPayment || '',
    whatsappNumber: debtor?.whatsappNumber || '',
    category: debtor?.category || CATEGORIES[0].id as Category,
    colorFlag: debtor?.colorFlag || 'none',
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Number *</label>
          <input
            type="text"
            name="accountNumber"
            required
            value={formData.accountNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer ID</label>
          <input
            type="text"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Client Name *</label>
          <input
            type="text"
            name="clientName"
            required
            value={formData.clientName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bank Name *</label>
          <input
            type="text"
            name="bankName"
            required
            value={formData.bankName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Outstanding Amount *</label>
          <input
            type="number"
            step="0.01"
            name="outstandingAmount"
            required
            value={formData.outstandingAmount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Paid Amount</label>
          <input
            type="number"
            step="0.01"
            name="paidAmount"
            value={formData.paidAmount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Outstanding Balance</label>
          <input
            type="number"
            readOnly
            value={balance}
            className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm text-gray-500 p-2 border font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Payment</label>
          <input
            type="date"
            name="dateOfPayment"
            value={formData.dateOfPayment}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
          <input
            type="tel"
            name="whatsappNumber"
            placeholder="+27..."
            value={formData.whatsappNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Color Flag</label>
          <select
            name="colorFlag"
            value={formData.colorFlag}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          >
            {COLOR_FLAGS.map(flag => (
              <option key={flag.id} value={flag.id}>{flag.label}</option>
            ))}
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
        >
          {isEdit ? 'Update Debtor' : 'Add Debtor'}
        </button>
      </div>
    </form>
  );
}
