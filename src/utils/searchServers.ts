import type { ServerList } from '@/types';

// 搜尋功能工具函數
export const searchServers = (
  serverList: ServerList,
  query: string,
): ServerList => {
  if (!query) return serverList;

  const normalizedQuery = query.toLowerCase().trim();

  return Object.values(serverList)
    .filter((server) => {
      // 精確 ID 匹配
      if (server.displayId.toString() === normalizedQuery) return true;

      // 模糊名稱匹配
      const normalizedName = server.name.toLowerCase().trim();
      return (
        normalizedName.includes(normalizedQuery) ||
        calculateSimilarity(normalizedName, normalizedQuery) > 0.6
      );
    })
    .reduce((acc, server) => {
      acc[server.id] = server;
      return acc;
    }, {} as ServerList);
};

// 計算文字相似度 (0-1)
export const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
};

// Levenshtein Distance 算法
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[str1.length][str2.length];
};
