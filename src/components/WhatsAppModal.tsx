'use client';

import { useState, useEffect } from 'react';
import type { Debtor } from '@/lib/types';
import { formatCurrency } from '@/lib/constants';
import { whatsappApi, type WhatsAppConfigData } from '@/services/api';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtor: Debtor | null;
  currentUser?: { fullName?: string; username?: string; role?: string } | null;
  onSuccess?: () => void;
  onOpenSettings?: () => void;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  debtor,
  currentUser,
  onSuccess,
  onOpenSettings
}: WhatsAppModalProps) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfigData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch current WhatsApp Cloud API configuration status
  useEffect(() => {
    if (isOpen) {
      whatsappApi.getConfig()
        .then((data) => setConfig(data))
        .catch((err) => console.warn('Could not fetch WhatsApp config:', err));
    }
  }, [isOpen]);

  // When debtor changes, prepare templates and recipient phone
  useEffect(() => {
    if (debtor) {
      setPhone(debtor.whatsappNumber || '');
      setErrorMsg('');
      setSuccessMsg('');
      setSelectedTemplate('standard');

      const collector = debtor.assignedCollector || currentUser?.fullName || 'Recovery Officer';
      const balanceStr = formatCurrency(debtor.outstandingBalance);

      const standardText = `Dear ${debtor.debtorName}, this is an official reminder from Recovery Credit regarding your ${debtor.clientName} account (${debtor.accountNumber}). The remaining balance due is ${balanceStr}. Please contact your assigned recovery officer (${collector}) to arrange payment or a meeting. Thank you.`;
      setMessage(standardText);
    }
  }, [debtor, currentUser]);

  if (!isOpen || !debtor) return null;

  const collector = debtor.assignedCollector || currentUser?.fullName || 'Recovery Officer';
  const balanceStr = formatCurrency(debtor.outstandingBalance);

  const applyTemplate = (type: string) => {
    setSelectedTemplate(type);
    setErrorMsg('');
    setSuccessMsg('');

    switch (type) {
      case 'standard':
        setMessage(
          `Dear ${debtor.debtorName}, this is an official reminder from Recovery Credit regarding your ${debtor.clientName} account (${debtor.accountNumber}). The remaining balance due is ${balanceStr}. Please contact your assigned recovery officer (${collector}) to arrange payment or a meeting. Thank you.`
        );
        break;
      case 'urgent':
        setMessage(
          `URGENT NOTICE: Dear ${debtor.debtorName}, your account (${debtor.accountNumber}) with ${debtor.clientName} has an overdue outstanding balance of ${balanceStr}. Immediate contact with Recovery Credit (${collector}) is required today to avoid formal credit recovery escalation.`
        );
        break;
      case 'settlement':
        setMessage(
          `Dear ${debtor.debtorName}, Recovery Credit is open to structured settlement discussions for your ${debtor.clientName} balance (${balanceStr}, Acc: ${debtor.accountNumber}). Please reply to this message or contact ${collector} to arrange a workable repayment plan.`
        );
        break;
      case 'promise':
        setMessage(
          `Dear ${debtor.debtorName}, this message confirms your payment commitment regarding account ${debtor.accountNumber} with ${debtor.clientName}. Total remaining balance is ${balanceStr}. Please ensure payment receipt is forwarded once deposited.`
        );
        break;
      case 'custom':
        break;
    }
  };

  const handleSendApi = async () => {
    if (!phone.trim()) {
      setErrorMsg('Please enter a valid WhatsApp phone number.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Message content cannot be empty.');
      return;
    }

    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await whatsappApi.send({
        debtorId: debtor.id,
        recipientPhone: phone.trim(),
        message: message.trim(),
        mode: 'api',
        collectorName: currentUser?.fullName || currentUser?.username || collector
      });

      if (res.success) {
        setSuccessMsg(`Message sent successfully via Meta WhatsApp Cloud API! Activity logged to debtor timeline.`);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrorMsg(res.error || 'Failed to send message via WhatsApp Cloud API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with WhatsApp Cloud API.');
    } finally {
      setSending(false);
    }
  };

  const handleSendWebFallback = async () => {
    if (!phone.trim()) {
      setErrorMsg('Please enter a valid WhatsApp phone number.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Message content cannot be empty.');
      return;
    }

    setSending(true);
    setErrorMsg('');

    try {
      const res = await whatsappApi.send({
        debtorId: debtor.id,
        recipientPhone: phone.trim(),
        message: message.trim(),
        mode: 'web',
        collectorName: currentUser?.fullName || currentUser?.username || collector
      });

      if (res.waLink) {
        window.open(res.waLink, '_blank', 'noopener,noreferrer');
        setSuccessMsg('WhatsApp Web launched in a new tab & reminder logged to timeline!');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating WhatsApp Web link.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.181-.076.355.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.102-.115.434-.506.549-.68.116-.173.232-.144.39-.086.159.058 1.012.477 1.185.564.173.086.289.13.332.202.043.072.043.419-.101.824z" />
                </svg>
                WhatsApp Business
              </span>
              {config?.isCloudApiReady ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                  Meta Cloud API Ready
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Direct API Setup Pending
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">Send WhatsApp Reminder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Debtor Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-slate-500 font-medium">Debtor Name</p>
            <p className="font-bold text-slate-900 truncate">{debtor.debtorName}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Bank / Client</p>
            <p className="font-semibold text-slate-800 truncate">{debtor.clientName}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Account / CIF</p>
            <p className="font-semibold text-slate-800">{debtor.accountNumber}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Remaining Balance</p>
            <p className="font-extrabold text-blue-700">{balanceStr}</p>
          </div>
        </div>

        {/* Recipient Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Recipient WhatsApp Number
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250788000000 or +27820000000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            International format recommended (e.g. +250 78x xxx xxx for Rwanda, +27 82x xxx xxxx for SA).
          </p>
        </div>

        {/* Template Quick Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Reminder Template
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => applyTemplate('standard')}
              className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition ${
                selectedTemplate === 'standard'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Standard Reminder
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('urgent')}
              className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition ${
                selectedTemplate === 'urgent'
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Urgent Notice
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('settlement')}
              className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition ${
                selectedTemplate === 'settlement'
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Settlement Plan
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('promise')}
              className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition ${
                selectedTemplate === 'promise'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Promise to Pay
            </button>
          </div>
        </div>

        {/* Message Content Preview / Editor */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Message Preview / Content
            </label>
            <span className="text-[11px] text-slate-400">{message.length} characters</span>
          </div>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:outline-none focus:bg-white focus:border-blue-500 font-sans"
          />
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-2">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-red-900">Meta WhatsApp Delivery Notice</p>
                <p className="mt-0.5 text-red-800 leading-relaxed">{errorMsg}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-200/60 pl-6">
              <button
                type="button"
                onClick={handleSendWebFallback}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.181-.076.355.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.102-.115.434-.506.549-.68.116-.173.232-.144.39-.086.159.058 1.012.477 1.185.564.173.086.289.13.332.202.043.072.043.419-.101.824z" />
                </svg>
                <span>Send via WhatsApp Web Instead</span>
              </button>

              <a
                href="https://developers.facebook.com/apps/27887479994259125/whatsapp-business/wa-dev-console/"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-lg font-medium text-xs transition"
              >
                Open Meta "To" Allowed List &rarr;
              </a>
            </div>
          </div>
        )}


        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">Sent Successfully</p>
              <p className="mt-0.5">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Cloud API Setup Notice if not yet fully ready */}
        {!config?.isCloudApiReady && (
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Meta App ID & Secret are active. To enable <strong>direct background sending</strong> without opening WhatsApp Web, add your WhatsApp Phone Number ID in settings.
              </span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-2.5 py-1 bg-white border border-blue-300 rounded text-blue-700 font-semibold text-[11px] hover:bg-blue-50 transition shrink-0 ml-2"
              >
                Configure
              </button>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* 1-Click WhatsApp Web Fallback */}
            <button
              type="button"
              disabled={sending}
              onClick={handleSendWebFallback}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              title="Open pre-filled chat in WhatsApp Web or WhatsApp Desktop App"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.181-.076.355.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.102-.115.434-.506.549-.68.116-.173.232-.144.39-.086.159.058 1.012.477 1.185.564.173.086.289.13.332.202.043.072.043.419-.101.824z" />
              </svg>
              <span>Open in WhatsApp Web</span>
            </button>

            {/* Direct Meta Cloud API Dispatch */}
            <button
              type="button"
              disabled={sending}
              onClick={handleSendApi}
              className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending via API...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send via Cloud API</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
