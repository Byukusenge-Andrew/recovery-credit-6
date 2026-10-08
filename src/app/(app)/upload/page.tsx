'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { importClientsDebtorsFromCSV, exportClientsDebtorsCSV, getCurrentUser } from '@/lib/store';
import type { User } from '@/lib/types';

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  useEffect(() => {
    setIsClientLoaded(true);
    setCurrentUser(getCurrentUser());
  }, []);

  const handleDownloadTemplate = () => {
    // Downloads the rich sample CSV created for the user
    const link = document.createElement('a');
    link.href = '/sample_debtors.csv';
    link.download = 'sample_debtors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExistingData = () => {
    const csv = exportClientsDebtorsCSV();
    if (!csv) {
      alert('No data available to download.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_debtors_full_backup_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      if (csvData) {
        const res = importClientsDebtorsFromCSV(csvData);
        setResults({ success: res.success, errors: res.errors });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isClientLoaded && currentUser?.role === 'collector') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Administrator Access Required</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Bulk uploading and importing bank portfolios is restricted to System Administrators. Please contact your administrator if you need new debtor files imported into the system.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
        >
          Return to My Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload & Download Data</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bulk import (Upload) or export (Download) information for <strong>Clients (Banks)</strong> and their <strong>Debtors</strong>.
          </p>
        </div>

        <button
          onClick={handleDownloadExistingData}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>Download All Data (Backup)</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
          <h3 className="font-semibold text-slate-800 text-sm mb-1">CSV File Specifications</h3>
          <p className="text-xs text-slate-500 mb-3">
            Your CSV file must include the following column headers:
          </p>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600 overflow-x-auto mb-3">
            client,debtor,accountNumber,customerId,outstandingAmount,paidAmount,dateOfPayment,whatsappNumber,category,colorFlag,collector,notes
          </div>
          <button 
            onClick={handleDownloadTemplate}
            className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-lg hover:bg-blue-100 transition text-xs"
          >
            Download Sample CSV (sample_debtors.csv)
          </button>
        </div>

        {/* Drag and Drop Upload Area */}
        <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center hover:bg-slate-50/50 transition">
          <input 
            type="file" 
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <span className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition shadow-sm">
              Select CSV File to Upload
            </span>
            <span className="text-slate-400 text-xs mt-2">or drag and drop your file here</span>
          </label>
        </div>

        {results && (
          <div className={`p-4 rounded-xl border ${results.errors.length > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
            <h3 className="font-semibold text-sm mb-1 text-slate-800">Upload Summary</h3>
            <p className="text-emerald-700 text-xs font-medium">{results.success} debtor records imported successfully.</p>
            {results.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-rose-700 text-xs font-medium mb-1">{results.errors.length} Errors encountered:</p>
                <ul className="list-disc pl-5 text-[11px] text-rose-600 space-y-0.5 max-h-32 overflow-y-auto">
                  {results.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
