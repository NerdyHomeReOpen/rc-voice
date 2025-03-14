import React, { createContext, useContext, useState } from 'react';

// Types
import { Translations, LanguageKeys, translations } from '@/types';

interface LanguageContextProps {
  language: LanguageKeys;
  setLanguage: (lang: LanguageKeys) => void;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(
  undefined,
);

interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<LanguageKeys>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('language') as LanguageKeys) || 'tw';
    }
    return 'tw';
  });

  const setLanguage = (lang: LanguageKeys) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('language', lang);
    }
    setLanguageState(lang);
  };

  const lang = translations[language];

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, translations: lang }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = (): Translations => {
  const { translations } = useLanguage();
  return translations;
};

LanguageProvider.displayName = 'LanguageProvider';

export { LanguageProvider };
