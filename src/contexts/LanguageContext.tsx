import React, { createContext, useContext, Component } from 'react';
import { Translations, LanguageKeys, translations } from '@/types';

interface LanguageContextProps {
  language: LanguageKeys;
  setLanguage: (lang: LanguageKeys) => void;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

class LanguageProvider extends Component<{ children: React.ReactNode }, { language: LanguageKeys }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    const lang = (localStorage.getItem('language') as LanguageKeys) || 'tw';
    this.state = {
      language: lang,
    };
  }

  setLanguage = (lang: LanguageKeys) => {
    localStorage.setItem('language', lang);
    this.setState({ language: lang });
  };

  render() {
    const { language } = this.state;
    const lang = translations[language];

    return (
      <LanguageContext.Provider value={{ language, setLanguage: this.setLanguage, translations: lang }}>
        {this.props.children}
      </LanguageContext.Provider>
    );
  }
}

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export { LanguageProvider };
