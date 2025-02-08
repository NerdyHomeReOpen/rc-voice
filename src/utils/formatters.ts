import { ServerPermission } from "@/types";

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
    [ServerPermission.Guest]: "遊客",
    [ServerPermission.Member]: "會員",
    [ServerPermission.ChannelAdmin]: "頻道管理員",
    [ServerPermission.ChannelManager]: "頻道管理員",
    [ServerPermission.ServerAdmin]: "群管理員",
    [ServerPermission.ServerOwner]: "群創建者",
    [ServerPermission.EventStaff]: "官方活動人員",
    [ServerPermission.Official]: "官方人員",
  };
  return permissionMap[permission] || "未知";
};
