'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { Language } from '@/lib/i18n';

interface Props {
  className?: string;
  variant?: 'pill' | 'dropdown' | 'compact';
}

export default function LanguageSwitcher({ className = '', variant = 'pill' }: Props) {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; nativeName: string; flag: string }[] = [
    { code: 'en', label: 'English', nativeName: 'English (US/UK)', flag: '🇬🇧' },
    { code: 'rw', label: 'Ikinyarwanda', nativeName: 'Ikinyarwanda (RW)', flag: '🇷🇼' },
  ];

  const current = languages.find((l) => l.code === lang) || languages[0];

  // Compact simple 2-way toggle
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-semibold ${className}`}>
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
            lang === 'en'
              ? 'bg-white text-blue-700 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="English"
        >
          <span>🇬🇧</span>
          <span>EN</span>
        </button>
        <button
          type="button"
          onClick={() => setLang('rw')}
          className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
            lang === 'rw'
              ? 'bg-white text-blue-700 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Ikinyarwanda"
        >
          <span>🇷🇼</span>
          <span>RW</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-xs flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        title="Switch Language / Hitamo Ururimi"
        aria-label="Select language"
      >
        <span className="text-sm">{current.flag}</span>
        <span className="font-semibold text-slate-800">{current.code.toUpperCase()}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white border border-slate-100 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Language / Ururimi
            </p>
          </div>
          <div className="p-1 space-y-0.5">
            {languages.map((item) => {
              const isSelected = item.code === lang;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLang(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.flag}</span>
                    <div>
                      <p className="leading-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{item.nativeName}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
