import { Permission } from "@/types";

export const formatTimestamp = (timestamp: number): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDay.getTime() === today.getTime()) {
    return messageDate.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return `昨天 ${messageDate.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  return `${messageDate.toLocaleDateString("zh-TW")} ${messageDate.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export const getPermissionText = (permission: number): string => {
  const permissionMap: Record<number, string> = {
    [Permission.Guest]: "遊客",
    [Permission.Member]: "會員",
    [Permission.ChannelAdmin]: "頻道管理員",
    [Permission.ChannelManager]: "頻道管理員",
    [Permission.ServerAdmin]: "群管理員",
    [Permission.ServerOwner]: "群創建者",
    [Permission.EventStaff]: "官方活動人員",
    [Permission.Official]: "官方人員",
  };
  return permissionMap[permission] || "未知";
};
