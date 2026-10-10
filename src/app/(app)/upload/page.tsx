'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/debtors');
  }, [router]);

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      </div>
      <h2 className="text-base font-bold text-slate-800">Redirecting to Debtors...</h2>
      <p className="text-xs text-slate-500">
        Bulk CSV upload and download capabilities are now directly integrated into the Debtors and Collectors pages.
      </p>
      <Link
        href="/debtors"
        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
      >
        Go to Debtors Page
      </Link>
    </div>
  );
}
