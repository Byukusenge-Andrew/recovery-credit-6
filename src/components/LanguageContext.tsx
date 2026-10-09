'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Language, TranslationKey, getStoredLanguage, setStoredLanguage, translate } from '@/lib/i18n';

interface LanguageContextType {
  lang: Language;
  language: Language;
  setLang: (newLang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'rw',
  language: 'rw',
  setLang: () => {},
  t: (key) => translate(key, 'rw'),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('rw');

  useEffect(() => {
    // Initial sync
    const initial = getStoredLanguage();
    setLangState(initial);

    // Event listener for in-window updates
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail && (customEvent.detail === 'en' || customEvent.detail === 'rw')) {
        setLangState(customEvent.detail);
      }
    };

    // Cross-tab storage updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rc6_language' && (e.newValue === 'en' || e.newValue === 'rw')) {
        setLangState(e.newValue);
      }
    };

    window.addEventListener('rc6_language_change', handleLangChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('rc6_language_change', handleLangChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    setStoredLanguage(newLang);
  };

  const t = useMemo(() => {
    return (key: TranslationKey) => translate(key, lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, language: lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}
