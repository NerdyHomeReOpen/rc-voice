/* eslint-disable @typescript-eslint/no-explicit-any */
// Services
import { apiService } from '@/services/api.service';


interface CreateServerData {
  userId: string;
  name: string;
  description: string;
  icon: File | null;
}

// ServerService
export const serverService = {
  // Create new a server
  createServer: async (serverData: CreateServerData): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('userId', serverData.userId);
      formData.append('name', serverData.name);
      formData.append('description', serverData.description);
      if(serverData.icon) formData.append('icon', serverData.icon);
      return await apiService.post('/servers', formData);
    } catch (error: Error | any) {
      throw new Error(error.message || '創建群組失敗');
    }
  },
};

export default serverService;
