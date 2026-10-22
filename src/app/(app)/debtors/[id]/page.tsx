'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateWhatsAppLink, getCurrentUser } from '@/lib/store';
import { debtorsApi, paymentsApi, activitiesApi } from '@/services/api';
import { ACTIVITY_TYPES, formatCurrency } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import CategoryBadge from '@/components/CategoryBadge';
import FlagDot from '@/components/FlagDot';
import WhatsAppModal from '@/components/WhatsAppModal';
import WhatsAppSettingsModal from '@/components/WhatsAppSettingsModal';
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
  const [loading, setLoading] = useState(true);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Activity form
  const [actType, setActType] = useState<ActivityType>(ACTIVITY_TYPES[0].value);
  const [actDesc, setActDesc] = useState('');
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);

  // Timeline Filters (Calendar date and activity type)
  const [timelineDateFilter, setTimelineDateFilter] = useState('');
  const [timelineTypeFilter, setTimelineTypeFilter] = useState('all');

  // Admin Payment Edit State & Handlers
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPayAmount, setEditPayAmount] = useState('');
  const [editPayDate, setEditPayDate] = useState('');
  const [editPayNotes, setEditPayNotes] = useState('');
  const [editPayError, setEditPayError] = useState('');

  // WhatsApp reminder modal & settings states
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isWhatsAppSettingsOpen, setIsWhatsAppSettingsOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [d, pList, aList] = await Promise.all([
        debtorsApi.getById(id),
        paymentsApi.getByDebtorId(id),
        activitiesApi.getByDebtorId(id)
      ]);
      setDebtor(d);
      setPayments(pList);
      setActivities(aList);
    } catch (err) {
      console.warn('Debtor detail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadData();
  }, [id]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtor) return;
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

    // Persist to Neon DB API
    try {
      await paymentsApi.create(id, {
        amountPaid: amt,
        paymentDate: payDate,
        recordedBy: currentUser?.fullName || 'Collector',
        role: currentUser?.role || 'collector',
        notes: payNotes
      });
    } catch (err) {
      console.warn('Payment record error:', err);
    }

    setPayAmount('');
    setPayNotes('');
    setPayError('');
    loadData();
  };

  const openEditPayment = (p: Payment) => {
    setEditingPayment(p);
    setEditPayAmount(String(p.amountPaid));
    setEditPayDate(p.paymentDate.split('T')[0]);
    setEditPayNotes(p.notes || '');
    setEditPayError('');
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amt = Number(editPayAmount);
    if (isNaN(amt) || amt < 0) {
      setEditPayError('Please enter a valid amount.');
      return;
    }

    try {
      await paymentsApi.update(editingPayment.id, {
        amountPaid: amt,
        paymentDate: editPayDate,
        notes: editPayNotes,
        adminUsername: currentUser?.username || 'admin'
      });
    } catch (err: any) {
      setEditPayError(err.message || 'Failed to update payment in database.');
      return;
    }

    setEditingPayment(null);
    loadData();
  };

  const handleDeletePayment = async (paymentId: string, amount: number) => {
    if (window.confirm(`Are you sure you want to remove this payment of R ${amount.toFixed(2)}? This action is logged in the audit trail.`)) {
      try {
        await paymentsApi.delete(paymentId);
      } catch (err) {
        console.warn('Payment delete error:', err);
      }
      loadData();
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actDesc.trim()) return;

    try {
      await activitiesApi.create(id, {
        activityType: actType,
        description: actDesc.trim(),
        scheduledDate: actDate,
        createdBy: currentUser?.fullName || currentUser?.username || 'Collector'
      });
      setActDesc('');
    } catch (err) {
      console.warn('Activity record error:', err);
    }

    loadData();
  };

  const handleWhatsApp = () => {
    if (!debtor) return;
    setIsWhatsAppModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
                              className="text-[10px] text-red-600 hover:text-red-800 font-medium px-1.5 py-0.5 rounded hover:bg-red-50 transition"
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
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
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

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t('detail_activity_timeline')}</h3>
                <p className="text-[11px] text-slate-400">Interaction history of calls, meetings, notes & reminders</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={timelineDateFilter}
                  onChange={(e) => setTimelineDateFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
                  title="Filter timeline by calendar date"
                />
                <select
                  value={timelineTypeFilter}
                  onChange={(e) => setTimelineTypeFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {(timelineDateFilter || timelineTypeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setTimelineDateFilter('');
                      setTimelineTypeFilter('all');
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Calendar Filter Badge */}
            {timelineDateFilter && (
              <div className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                <span>Filtered on calendar date: <strong>{timelineDateFilter}</strong></span>
                <button
                  onClick={() => setTimelineDateFilter('')}
                  className="text-blue-500 hover:text-blue-800 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {(() => {
              const filteredActivities = activities.filter((act) => {
                const actDateStr = act.scheduledDate || (act.createdAt ? act.createdAt.split('T')[0] : '');
                const matchesDate = !timelineDateFilter || actDateStr === timelineDateFilter;
                const matchesType = timelineTypeFilter === 'all' || act.activityType === timelineTypeFilter;
                return matchesDate && matchesType;
              });

              if (filteredActivities.length === 0) {
                return (
                  <p className="text-slate-400 text-xs italic py-4 text-center">
                    {activities.length === 0
                      ? t('detail_no_activity')
                      : 'No activities recorded on the selected calendar date.'}
                  </p>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredActivities.map((act) => {
                    const typeInfo = ACTIVITY_TYPES.find((t) => t.value === act.activityType);
                    return (
                      <div key={act.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs transition">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${
                            act.activityType === 'call_made'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : act.activityType === 'meeting_scheduled'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : act.activityType === 'note'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : act.activityType === 'payment_recorded'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {act.activityType === 'call_made' && (
                              <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                            )}
                            {act.activityType === 'meeting_scheduled' && (
                              <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253 3.75h18M4.5 7.5h15a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 22.5h-15A2.25 2.25 0 012.25 20.25V9.75A2.25 2.25 0 014.5 7.5z" />
                              </svg>
                            )}
                            {act.activityType === 'note' && (
                              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                            )}
                            <span>{typeInfo?.label || act.activityType}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {act.scheduledDate || (act.createdAt ? new Date(act.createdAt).toLocaleDateString() : '')}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mt-1">{act.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                          <span>Logged by: <strong className="text-slate-700">{act.createdBy}</strong></span>
                          {act.createdAt && (
                            <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* WhatsApp Reminder Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        debtor={debtor}
        currentUser={currentUser}
        onClose={() => setIsWhatsAppModalOpen(false)}
        onSuccess={() => loadData()}
        onOpenSettings={() => setIsWhatsAppSettingsOpen(true)}
      />

      {/* WhatsApp Cloud API Settings Modal */}
      <WhatsAppSettingsModal
        isOpen={isWhatsAppSettingsOpen}
        onClose={() => setIsWhatsAppSettingsOpen(false)}
      />
    </div>
  );
}

