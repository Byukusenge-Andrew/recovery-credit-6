'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDebtor, getPayments, getActivities, addPayment, addActivity, generateWhatsAppLink, getCurrentUser } from '@/lib/store';
import { ACTIVITY_TYPES, formatCurrency } from '@/lib/constants';
import CategoryBadge from '@/components/CategoryBadge';
import FlagDot from '@/components/FlagDot';
import type { Debtor, Payment, Activity, User } from '@/lib/types';

export default function DebtorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [debtor, setDebtor] = useState<Debtor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');

  // Activity form
  const [actType, setActType] = useState(ACTIVITY_TYPES[0].value);
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
        <h2 className="text-base font-semibold text-slate-700">Debtor file not found</h2>
        <button onClick={() => router.push('/debtors')} className="mt-3 text-xs text-blue-600 hover:underline">
          Return to Debtors List
        </button>
      </div>
    );
  }

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || isNaN(Number(payAmount))) return;

    addPayment({
      debtorId: id,
      amountPaid: Number(payAmount),
      paymentDate: payDate,
      recordedBy: currentUser?.fullName || 'Collector',
      notes: payNotes
    });

    setPayAmount('');
    setPayNotes('');
    loadData();
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
              Client (Bank): {debtor.clientName}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              Assigned Collector: <strong>{debtor.assignedCollector || 'Unassigned'}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {debtor.debtorName || (debtor as any).clientName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Account: {debtor.accountNumber} • Customer ID: {debtor.customerId || '—'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => router.push('/debtors')} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-xs transition">
            Back to List
          </button>
          <Link href={`/debtors/${id}/edit`} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-xs transition">
            Edit File
          </Link>
          {debtor.whatsappNumber && (
            <button onClick={handleWhatsApp} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition">
              <span>Send WhatsApp Reminder</span>
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
              <span className="capitalize">{debtor.colorFlag} Flag Priority</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Current Outstanding Balance</span>
            <p className={`text-2xl font-bold ${debtor.outstandingBalance > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
              {formatCurrency(debtor.outstandingBalance)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div>
            <p className="text-slate-400 font-medium mb-1">Client (Bank Name)</p>
            <p className="font-semibold text-slate-800">{debtor.clientName || '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1">WhatsApp Number</p>
            <p className="font-semibold text-slate-800">{debtor.whatsappNumber || '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1">Total Outstanding Amount</p>
            <p className="font-semibold text-slate-800">{formatCurrency(debtor.outstandingAmount)}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1">Total Paid</p>
            <p className="font-semibold text-emerald-600">{formatCurrency(debtor.paidAmount)}</p>
          </div>
        </div>

        {debtor.notes && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">Case Notes & Details</p>
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{debtor.notes}</p>
          </div>
        )}
      </div>

      {/* 2 Column Section: Payment Recording & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Record Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Amount Paid (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Payment Date</label>
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
                <label className="block text-slate-500 font-medium mb-1">Payment Reference / Note</label>
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
                Save Payment
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Payment History</h3>
            {payments.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No payments recorded for this debtor yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{formatCurrency(p.amountPaid)}</p>
                      <p className="text-[11px] text-slate-400">{p.notes || 'No reference'} • Recorded by: {p.recordedBy}</p>
                    </div>
                    <span className="text-slate-500 text-[11px]">{new Date(p.paymentDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Log Activity / Interaction</h3>
            <form onSubmit={handleAddActivity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Activity Type</label>
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Date</label>
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
                <label className="block text-slate-500 font-medium mb-1">Interaction Details</label>
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
                Log Activity
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No activity recorded for this debtor yet.</p>
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
