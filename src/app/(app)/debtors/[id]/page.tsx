'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDebtor, getPayments, getActivities, addPayment, updatePayment, deletePayment, addActivity, generateWhatsAppLink, getCurrentUser } from '@/lib/store';
import { ACTIVITY_TYPES, formatCurrency } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import CategoryBadge from '@/components/CategoryBadge';
import FlagDot from '@/components/FlagDot';
import type { Debtor, Payment, Activity, User, ActivityType } from '@/lib/types';

export default function DebtorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const id = params.id as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [debtor, setDebtor] = useState<Debtor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Activity form
  const [actType, setActType] = useState<ActivityType>(ACTIVITY_TYPES[0].value);
  const [actDesc, setActDesc] = useState('');
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    const d = getDebtor(id);
    setDebtor(d);
    if (d) {
      setPayments(getPayments(id));
      setActivities(getActivities(id));
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadData();
  }, [id]);

  if (!debtor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-semibold text-slate-700">{t('detail_not_found')}</h2>
        <button onClick={() => router.push('/debtors')} className="mt-3 text-xs text-blue-600 hover:underline">
          {t('detail_return_list')}
        </button>
      </div>
    );
  }

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    const amt = Number(payAmount);
    if (!payAmount || isNaN(amt) || amt <= 0) {
      setPayError('Please enter a valid positive payment amount.');
      return;
    }

    if (amt > debtor.outstandingBalance) {
      setPayError(
        `Payment amount (R ${amt.toFixed(2)}) cannot exceed the remaining loan balance (R ${debtor.outstandingBalance.toFixed(2)}).`
      );
      return;
    }

    addPayment({
      debtorId: id,
      amountPaid: amt,
      paymentDate: payDate,
      recordedBy: currentUser?.fullName || 'Collector',
      notes: payNotes
    });

    setPayAmount('');
    setPayNotes('');
    setPayError('');
    loadData();
  };

  // Admin Payment Edit State & Handlers
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPayAmount, setEditPayAmount] = useState('');
  const [editPayDate, setEditPayDate] = useState('');
  const [editPayNotes, setEditPayNotes] = useState('');
  const [editPayError, setEditPayError] = useState('');

  const openEditPayment = (p: Payment) => {
    setEditingPayment(p);
    setEditPayAmount(String(p.amountPaid));
    setEditPayDate(p.paymentDate.split('T')[0]);
    setEditPayNotes(p.notes || '');
    setEditPayError('');
  };

  const handleUpdatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amt = Number(editPayAmount);
    if (isNaN(amt) || amt < 0) {
      setEditPayError('Please enter a valid amount.');
      return;
    }
    const res = updatePayment(editingPayment.id, {
      amountPaid: amt,
      paymentDate: editPayDate,
      notes: editPayNotes
    });
    if (!res.success) {
      setEditPayError(res.error || 'Failed to update payment.');
      return;
    }
    setEditingPayment(null);
    loadData();
  };

  const handleDeletePayment = (paymentId: string, amount: number) => {
    if (window.confirm(`Are you sure you want to remove this payment of R ${amount.toFixed(2)}? This action is logged in the audit trail.`)) {
      const res = deletePayment(paymentId);
      if (!res.success) {
        alert(res.error || 'Failed to delete payment.');
      } else {
        loadData();
      }
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actDesc) return;

    addActivity({
      debtorId: id,
      activityType: actType as Activity['activityType'],
      description: actDesc,
      scheduledDate: actDate,
      createdBy: currentUser?.fullName || 'Collector'
    });

    setActDesc('');
    loadData();
  };

  const handleWhatsApp = () => {
    const link = generateWhatsAppLink(debtor);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs">
              {t('detail_client_label')} {debtor.clientName}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              {t('detail_collector_label')} <strong>{debtor.assignedCollector || t('form_unassigned')}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {debtor.debtorName || (debtor as any).clientName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('detail_account_label')} {debtor.accountNumber} • {t('detail_customer_id')} {debtor.customerId || '—'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => router.push('/debtors')} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-xs transition">
            {t('detail_back')}
          </button>
          <Link href={`/debtors/${id}/edit`} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-xs transition">
            {t('detail_edit')}
          </Link>
          {debtor.whatsappNumber && (
            <button onClick={handleWhatsApp} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition">
              <span>{t('detail_send_whatsapp')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Debtor Info Cards in White Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <CategoryBadge category={debtor.category} />
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FlagDot flag={debtor.colorFlag} />
              <span className="capitalize">{t(`flag_${debtor.colorFlag}` as any) || `${debtor.colorFlag} Flag Priority`}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">{t('detail_current_balance')}</span>
            <p className={`text-2xl font-bold ${debtor.outstandingBalance > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
              {formatCurrency(debtor.outstandingBalance)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div>
            <p className="text-slate-400 font-medium mb-1">{t('form_client_name')}</p>
            <p className="font-semibold text-slate-800">{debtor.clientName || '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1">{t('detail_whatsapp_num')}</p>
            <p className="font-semibold text-slate-800">{debtor.whatsappNumber || '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1">{t('detail_total_claim')}</p>
            <p className="font-semibold text-slate-800">{formatCurrency(debtor.outstandingAmount)}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1">{t('detail_total_paid')}</p>
            <p className="font-semibold text-emerald-600">{formatCurrency(debtor.paidAmount)}</p>
          </div>
        </div>

        {debtor.notes && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">{t('detail_notes_title')}</p>
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{debtor.notes}</p>
          </div>
        )}
      </div>

      {/* 2 Column Section: Payment Recording & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{t('detail_record_payment')}</h3>
            {payError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{payError}</span>
              </div>
            )}
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">{t('detail_amount_paid')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={debtor.outstandingBalance}
                    value={payAmount}
                    onChange={(e) => {
                      setPayError('');
                      setPayAmount(e.target.value);
                    }}
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">{t('detail_payment_date')}</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">{t('detail_pay_ref')}</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Receipt number, deposit slip, or transaction reference"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition text-xs shadow-sm mt-2"
              >
                {t('detail_save_payment')}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">{t('detail_payment_history')}</h3>
              {currentUser?.role === 'collector' && (
                <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Immutable (Admin edit only)
                </span>
              )}
            </div>
            {payments.length === 0 ? (
              <p className="text-slate-400 text-xs italic">{t('detail_no_payments')}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{formatCurrency(p.amountPaid)}</p>
                        {currentUser?.role === 'admin' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditPayment(p)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium px-1.5 py-0.5 rounded hover:bg-blue-50 transition"
                              title="Edit this payment (Admin only)"
                            >
                              Edit
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              onClick={() => handleDeletePayment(p.id, p.amountPaid)}
                              className="text-[10px] text-rose-600 hover:text-rose-800 font-medium px-1.5 py-0.5 rounded hover:bg-rose-50 transition"
                              title="Delete this payment (Admin only)"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{p.notes || 'No reference'} • Recorded by: {p.recordedBy}</p>
                    </div>
                    <span className="text-slate-500 text-[11px]">{new Date(p.paymentDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Admin Edit Payment */}
        {editingPayment && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Payment Record</h3>
                  <p className="text-[11px] text-slate-400">Admin Authorization Required</p>
                </div>
                <button
                  onClick={() => setEditingPayment(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {editPayError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {editPayError}
                </div>
              )}

              <form onSubmit={handleUpdatePayment} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Amount Paid (R) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPayAmount}
                    onChange={(e) => setEditPayAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={editPayDate}
                    onChange={(e) => setEditPayDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Notes / Reason for Adjustment</label>
                  <input
                    type="text"
                    value={editPayNotes}
                    onChange={(e) => setEditPayNotes(e.target.value)}
                    placeholder="E.g., Adjusted bank transaction fee"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPayment(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-xs shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Activity Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{t('detail_log_activity')}</h3>
            <form onSubmit={handleAddActivity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">{t('detail_activity_type')}</label>
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value as ActivityType)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">{t('detail_activity_date')}</label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">{t('detail_interaction_details')}</label>
                <textarea
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  required
                  rows={3}
                  placeholder="Summary of conversation, promise date, negotiation outcome..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-xs shadow-sm mt-2"
              >
                {t('detail_btn_log_activity')}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{t('detail_activity_timeline')}</h3>
            {activities.length === 0 ? (
              <p className="text-slate-400 text-xs italic">{t('detail_no_activity')}</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => {
                  const typeInfo = ACTIVITY_TYPES.find((t) => t.value === act.activityType);
                  return (
                    <div key={act.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800">{typeInfo?.label || act.activityType}</span>
                        <span className="text-[11px] text-slate-400">
                          {act.scheduledDate ? new Date(act.scheduledDate).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-slate-600">{act.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5">Logged by: {act.createdBy}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
