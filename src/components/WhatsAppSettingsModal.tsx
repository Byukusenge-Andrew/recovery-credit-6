'use client';

import { useState, useEffect } from 'react';
import { whatsappApi, type WhatsAppConfigData } from '@/services/api';

interface WhatsAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function WhatsAppSettingsModal({
  isOpen,
  onClose,
  onSaved
}: WhatsAppSettingsModalProps) {
  const [config, setConfig] = useState<WhatsAppConfigData | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await whatsappApi.getConfig();
      setConfig(data);
      if (data.phoneNumberId) setPhoneNumberId(data.phoneNumberId);
      if (data.businessAccountId) setBusinessAccountId(data.businessAccountId);
    } catch (err: any) {
      console.warn('Failed to load WhatsApp config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      loadConfig();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestToken = async () => {
    if (!accessToken.trim()) {
      setFeedback({ type: 'error', message: 'Please enter an Access Token to test.' });
      return;
    }
    setTesting(true);
    setFeedback(null);

    try {
      const res = await whatsappApi.saveConfig({
        accessToken: accessToken.trim(),
        testOnly: true
      });
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Access token successfully verified with Meta Graph API!' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to verify token with Meta.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await whatsappApi.saveConfig({
        phoneNumberId: phoneNumberId.trim(),
        accessToken: accessToken.trim() || undefined,
        businessAccountId: businessAccountId.trim()
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'WhatsApp Cloud API settings saved successfully!' });
        await loadConfig();
        if (onSaved) onSaved();
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  const isTokenExpired = Boolean(config?.userTokenStatus && !config.userTokenStatus.valid);
  const isTokenActive = Boolean(config?.userTokenStatus && config.userTokenStatus.valid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Meta Developer Settings
              </span>
              {config?.isCloudApiReady ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cloud API Active
                </span>
              ) : isTokenExpired ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Token Expired (Web Fallback Active)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                  Web Mode Ready
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">WhatsApp Cloud API Configuration</h2>
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

        {/* Token Expiration Alert if detected */}
        {isTokenExpired && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-amber-900">Current Meta Access Token Has Expired</p>
                <p className="text-amber-800 leading-relaxed mt-0.5">
                  {config?.userTokenStatus?.error || 'The temporary token generated in Meta Console expired after 24 hours.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200/60 pl-6">
              <a
                href="https://developers.facebook.com/apps/27887479994259125/whatsapp-business/wa-dev-console/"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-white border border-amber-300 rounded text-amber-800 font-semibold text-[11px] hover:bg-amber-100 transition inline-flex items-center gap-1"
              >
                <span>Generate New 24h Token in Meta Console &rarr;</span>
              </a>
              <a
                href="https://business.facebook.com/settings/system-users"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-white border border-amber-300 rounded text-amber-800 font-semibold text-[11px] hover:bg-amber-100 transition inline-flex items-center gap-1"
              >
                <span>Create Permanent System User Token &rarr;</span>
              </a>
            </div>
          </div>
        )}

        {/* Meta App Identity Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Meta App Details</span>
            {config?.metaAppStatus?.connected && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Connected ({config.metaAppStatus.appName || 'RecoveryCredit'})
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-slate-500 font-medium">Meta App ID</p>
              <p className="font-mono font-semibold text-slate-900 mt-0.5">
                {config?.metaAppId || '27887479994259125'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Meta App Secret</p>
              <p className="font-mono font-semibold text-slate-700 mt-0.5">
                {config?.metaAppSecretMasked || 'ce81b8b9****3953'} (Secured)
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to get and keep your WhatsApp Cloud API credentials active:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
            <li>
              Go to <a href="https://developers.facebook.com/apps/27887479994259125/whatsapp-business/wa-dev-console/" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">Meta Developer Console (API Setup)</a>.
            </li>
            <li>Copy the <strong>Phone number ID</strong> (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">1354251641111404</code>) and paste it into the field below.</li>
            <li>
              <strong>Temporary Token:</strong> Click &quot;Generate Access Token&quot; on the API Setup page and paste it below (valid 24h).
            </li>
            <li>
              <strong>Permanent Token:</strong> In <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">Business Settings &gt; System Users</a>, create a System User and generate a token with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">whatsapp_business_messaging</code> so it never expires.
            </li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              WhatsApp Phone Number ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="e.g. 1354251641111404"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Found under WhatsApp &gt; API Setup in your Meta App dashboard.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                WhatsApp Access Token{' '}
                {isTokenActive ? (
                  <span className="text-emerald-600 text-[11px] font-normal">&bull; Active & Valid</span>
                ) : isTokenExpired ? (
                  <span className="text-red-600 text-[11px] font-normal">&bull; Expired</span>
                ) : null}
              </label>
              {accessToken && (
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestToken}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  {testing ? 'Testing...' : 'Test Token'}
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={config?.hasAccessToken ? 'Paste a new EAAG... token to replace the expired one...' : 'Paste EAAG... access token here'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-blue-500 text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Requires permission <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">whatsapp_business_messaging</code>.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              WhatsApp Business Account ID (WABA ID) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              placeholder="e.g. 1389436526700139"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {feedback.type === 'success' ? (
                <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
