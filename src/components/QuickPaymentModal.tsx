'use client';

import { useState, useEffect } from 'react';
import { debtorsApi, paymentsApi } from '@/services/api';
import { getCurrentUser } from '@/lib/store';
import { formatCurrency } from '@/lib/constants';
import type { Debtor } from '@/lib/types';

interface QuickPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded?: () => void;
  preselectedDebtorId?: string;
}

export default function QuickPaymentModal({
  isOpen,
  onClose,
  onPaymentRecorded,
  preselectedDebtorId,
}: QuickPaymentModalProps) {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'momo' | 'bank' | 'cash'>('momo');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccess(false);
      return;
    }

    const fetchDebtors = async () => {
      setLoading(true);
      try {
        const list = await debtorsApi.list();
        setDebtors(list);
        if (preselectedDebtorId) {
          const match = list.find((d) => d.id === preselectedDebtorId);
          if (match) setSelectedDebtor(match);
        }
      } catch (err) {
        console.error('Error fetching debtors for payment modal:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebtors();
  }, [isOpen, preselectedDebtorId]);

  if (!isOpen) return null;

  const filteredDebtors = debtors
    .filter(
      (d) =>
        (d.debtorName || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.accountNumber && d.accountNumber.toLowerCase().includes(search.toLowerCase())) ||
        (d.whatsappNumber && d.whatsappNumber.includes(search))
    )
    .slice(0, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDebtor) {
      setError('Please select a debtor.');
      return;
    }

    const numAmount = Number(amount.replace(/[^0-9.]/g, ''));
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (numAmount > selectedDebtor.outstandingBalance) {
      setError(
        `Amount (${formatCurrency(numAmount)}) exceeds outstanding balance (${formatCurrency(
          selectedDebtor.outstandingBalance
        )}).`
      );
      return;
    }

    setSubmitting(true);
    const currentUser = getCurrentUser();
    const formattedNotes = [
      method ? `Method: ${method.toUpperCase()}` : '',
      reference ? `Ref: ${reference}` : '',
      notes ? notes : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      await paymentsApi.create(selectedDebtor.id, {
        amountPaid: numAmount,
        paymentDate,
        recordedBy: currentUser?.fullName || currentUser?.username || 'Collector',
        role: currentUser?.role || 'collector',
        notes: formattedNotes,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAmount('');
        setReference('');
        setNotes('');
        setSelectedDebtor(null);
        if (onPaymentRecorded) onPaymentRecorded();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#15803d]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Record Payment Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Payment successfully posted to ledger!
            </div>
          )}

          {/* Select Debtor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Select Debtor
            </label>
            {selectedDebtor ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{selectedDebtor.debtorName || selectedDebtor.clientName}</div>
                  <div className="text-[11px] text-slate-500">
                    {selectedDebtor.clientName} · Acc: {selectedDebtor.accountNumber || 'N/A'}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-0.5 font-mono">
                    Balance: {formatCurrency(selectedDebtor.outstandingBalance)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDebtor(null)}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Type debtor name or account number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
                {loading ? (
                  <div className="text-[11px] text-slate-400 py-2 text-center">Loading debtors...</div>
                ) : (
                  <div className="mt-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                    {filteredDebtors.length === 0 ? (
                      <div className="p-2.5 text-center text-[11px] text-slate-400">No debtors match search</div>
                    ) : (
                      filteredDebtors.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setSelectedDebtor(d);
                            setSearch('');
                          }}
                          className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{d.debtorName || d.clientName}</div>
                            <div className="text-[10px] text-slate-400">
                              {d.clientName} · {d.accountNumber || 'No ref'}
                            </div>
                          </div>
                          <div className="font-mono text-[11px] font-bold text-slate-700">
                            {formatCurrency(d.outstandingBalance)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Amount (RWF)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                R
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Quick Preset Chips */}
            {selectedDebtor && (
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount('50000')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold"
                >
                  +50k
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('100000')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold"
                >
                  +100k
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('250000')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold"
                >
                  +250k
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(String(selectedDebtor.outstandingBalance))}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold"
                >
                  Full ({formatCurrency(selectedDebtor.outstandingBalance)})
                </button>
              </div>
            )}
          </div>

          {/* Method Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('momo')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center transition ${
                  method === 'momo'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Mobile Money
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center transition ${
                  method === 'bank'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Bank Deposit
              </button>
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center transition ${
                  method === 'cash'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Cash Receipt
              </button>
            </div>
          </div>

          {/* Reference & Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                TxID / Slip Reference
              </label>
              <input
                type="text"
                placeholder="e.g. MP2610.998"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Collector Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Partial installment received in presence of guarantor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedDebtor}
            className="w-full mt-2 py-2.5 px-4 bg-[#15803d] hover:bg-[#166534] disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2"
          >
            {submitting ? 'Recording Transaction...' : 'Post Payment to Ledger'}
          </button>
        </form>
      </div>
    </div>
  );
}
