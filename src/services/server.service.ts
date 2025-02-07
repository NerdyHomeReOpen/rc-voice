import { apiService } from "./api.service";
import type { Server } from "@/types";

interface CreateServerData {
  name: string;
  description: string;
  avatar: File | null;
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

        const response = await apiService.post('/servers', 
            {
              name: serverData.name,
              description: serverData.description,
              avatar: serverData.avatar
            },
            {
              headers: {
                'userId': userId
              },
              credentials: 'same-origin'
            }
          );
    
        if (response.error) {
            throw new Error(response.error || "創建伺服器失敗");
        }

          return response.server;
        } catch (error: Error | any) {
      throw new Error(error.message || "更新個人資料時發生錯誤");
    }
  },

 
};

export default serverService;
