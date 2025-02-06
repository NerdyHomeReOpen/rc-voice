import { apiService } from "./api.service";
import type { User } from "@/types";

interface UpdateProfileData {
  userId: User["id"],
  name: User["name"],
  gender: User["gender"],
}

// 用戶服務
export const userService = {
  // 更新用戶資料
  updateProfile: async (userData: UpdateProfileData) => {
    try {
      const response = await apiService.patch("/userData", {
        userId: userData.userId,
        name: userData.name,
        gender: userData.gender,
      });

      if (response.error) {
        throw new Error(response.error || "更新資料失敗");
      }

      return response.data;
    } catch (error: Error | any) {
      throw new Error(error.message || "更新個人資料時發生錯誤");
    }
  },

  //   // 獲取用戶資料
  //   getProfile: async () => {
  //     try {
  //       const response = await apiService.get(ENDPOINTS.PROFILE);

  //       if (response.success) {
  //         return response.data;
  //       }
  //       throw new Error(response.message || "獲取資料失敗");
  //     } catch (error) {
  //       throw new Error(error.message || "獲取個人資料時發生錯誤");
  //     }
  //   },
};

export default userService;
