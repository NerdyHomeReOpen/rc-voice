import React, { createContext, useContext, useState } from 'react';

// Types
import { Translation, LanguageKey, translations } from '@/types';

interface LanguageContextProps {
  key: LanguageKey;
  set: (lang: LanguageKey) => void;
  tr: Translation;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<LanguageKey>('tw');
  const translation = translations[language];

  return (
    <LanguageContext.Provider
      value={{ set: setLanguage, tr: translation, key: language }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

LanguageProvider.displayName = 'LanguageProvider';

export { LanguageProvider };
