import { Permission, Translations } from '@/types';

const langMap: Record<string, string> = {
  tw: 'zh-TW',
  cn: 'zh-CN',
  en: 'en-US',
  jp: 'ja-JP',
  ru: 'ru-RU',
};

export const formatTimestamp = (
  timestamp: number,
  language = 'tw',
  lang: Translations,
): string => {
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
    return `${lang.yesterday} ${messageDate.toLocaleTimeString(timezoneLang, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return `${messageDate.toLocaleDateString(
    timezoneLang,
  )} ${messageDate.toLocaleTimeString(timezoneLang, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const getPermissionText = (
  permission: number,
  lang: Translations,
): string => {
  const permissionMap: Record<number, string> = {
    [Permission.Guest]: lang.guest, // 1
    [Permission.Member]: lang.member, // 2
    [Permission.ChannelAdmin]: lang.channelAdmin, // 3
    [Permission.ChannelManager]: lang.channelManager, // 4
    [Permission.ServerAdmin]: lang.serverAdmin, // 5
    [Permission.ServerOwner]: lang.serverOwner, // 6
    [Permission.EventStaff]: lang.eventStaff, // 7
    [Permission.Official]: lang.official, // 8
  };
  return permissionMap[permission] || '未知';
};
