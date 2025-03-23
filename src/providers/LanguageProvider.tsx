import React, { createContext, useContext, useEffect, useState } from 'react';

// Types
import { Translation, LanguageKey, translations, Permission } from '@/types';

interface LanguageContextProps {
  key: LanguageKey;
  tr: Translation;
  set: (lang: LanguageKey) => void;
  getPermissionText: (permission: Permission) => string;
  getFormatTimestamp: (timestamp: number) => string;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<LanguageKey>('tw');
  const translation = translations[language];

  const getPermissionText = (permission: number): string => {
    const permissionMap: Record<number, string> = {
      [Permission.Guest]: translation.guest, // 1
      [Permission.Member]: translation.member, // 2
      [Permission.ChannelAdmin]: translation.channelAdmin, // 3
      [Permission.ChannelManager]: translation.channelManager, // 4
      [Permission.ServerAdmin]: translation.serverAdmin, // 5
      [Permission.ServerOwner]: translation.serverOwner, // 6
      [Permission.EventStaff]: translation.eventStaff, // 7
      [Permission.Official]: translation.official, // 8
    };
    return permissionMap[permission] || translation.unknownUser;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedLang = localStorage.getItem('language') as LanguageKey;
    if (savedLang) setLanguage(savedLang);
  }, []);

  const getFormatTimestamp = (timestamp: number): string => {
    const langMap: Record<LanguageKey, string> = {
      tw: 'zh-TW',
      cn: 'zh-CN',
      en: 'en-US',
      jp: 'ja-JP',
    };
    const timezoneLang = langMap[language] || 'zh-TW';
    const now = new Date();
    const messageDate = new Date(timestamp);
    const messageDay = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate(),
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString(timezoneLang, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (messageDay.getTime() === yesterday.getTime()) {
      return `${translation.yesterday} ${messageDate.toLocaleTimeString(
        timezoneLang,
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      )}`;
    }
    return `${messageDate.toLocaleDateString(
      timezoneLang,
    )} ${messageDate.toLocaleTimeString(timezoneLang, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        tr: translation,
        key: language,
        set: setLanguage,
        getPermissionText,
        getFormatTimestamp,
      }}
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
