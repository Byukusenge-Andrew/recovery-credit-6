'use client';

import { useState, useRef } from 'react';
import { importDebtorsFromCSV } from '@/lib/store';

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const handleDownloadTemplate = () => {
    const headers = [
      'accountNumber', 'customerId', 'clientName', 'bankName', 
      'outstandingAmount', 'paidAmount', 'dateOfPayment', 
      'whatsappNumber', 'category', 'colorFlag', 'notes'
    ].join(',');
    
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debtors_template.csv';
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
        const res = importDebtorsFromCSV(csvData);
        setResults({ success: res.success, errors: res.errors });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload Data</h1>
        <p className="text-sm text-slate-500 mt-0.5">Bulk import your debtors records from a CSV file.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
          <h3 className="font-semibold text-slate-800 text-sm mb-1">CSV Format Specifications</h3>
          <p className="text-xs text-slate-500 mb-3">
            Ensure your file contains the required headers listed below.
          </p>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600 overflow-x-auto mb-3">
            accountNumber,customerId,clientName,bankName,outstandingAmount,paidAmount,dateOfPayment,whatsappNumber,category,colorFlag,notes
          </div>
          <button 
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition text-xs"
          >
            Download Sample Template
          </button>
        </div>

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
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-sm">
              Select CSV File
            </span>
            <span className="text-slate-400 text-xs mt-2">or drag and drop your file here</span>
          </label>
        </div>

        {results && (
          <div className={`p-4 rounded-xl border ${results.errors.length > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
            <h3 className="font-semibold text-sm mb-1 text-slate-800">Upload Summary</h3>
            <p className="text-emerald-700 text-xs font-medium">{results.success} records imported successfully.</p>
            {results.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-rose-700 text-xs font-medium mb-1">{results.errors.length} errors found:</p>
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
