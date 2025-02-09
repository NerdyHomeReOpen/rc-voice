import { API_URL, apiService } from './api.service';
import type { Server } from '@/types';

interface CreateServerData {
  userId: string;
  name: string;
  description: string;
  icon: File | null;
}

// ServerService
export const serverService = {
  // Create new a server
  createServer: async (serverData: CreateServerData): Promise<Server> => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('用戶未登入');
      }

      const formData = new FormData();
      formData.append('userId', serverData.userId);
      formData.append('name', serverData.name);
      formData.append('description', serverData.description);
      if (serverData.icon) {
        formData.append('icon', serverData.icon);
      }

      const response = await apiService.post("/servers", formData)

      if (response.error) {
        throw new Error(response.error || '創建伺服器失敗');
      }

      return response.server;
    } catch (error: Error | any) {
      throw new Error(error.message || '更新個人資料時發生錯誤');
    }
  },
};

export default serverService;
