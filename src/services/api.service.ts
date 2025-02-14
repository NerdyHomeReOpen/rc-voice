export const API_URL = "http://localhost:4500";

interface RequestOptions {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

interface ApiRequestData {
  [key: string]: any;
}

// Utility functions
export const base64encode = (str: string): String => {
  try {
    return btoa(str);
  } catch (e) {
    return str;
  }
};

// Error handling utility
const handleResponse = async (response: Response): Promise<any> => {
  const data = await response.json();
  console.log(data);

  if (!response.ok) {
    // Handle specific error codes
    if (response.status === 409) {
      throw new Error(data.message || "資源已存在");
    }
    throw new Error(data.message || "請求失敗");
  }
  if (!data.data){
    throw new Error(data.message || "請求失敗");
  }

  return data.data;
};

// Base API service
export const apiService = {
  // GET request
  get: async (endpoint: string) => {
    try {
      // Fetch
      const response = await fetch(`${API_URL}${endpoint}`);
      // Handle response
      return handleResponse(response);
    } catch (error: Error | any) {
      throw new Error(error.message || "獲取資料失敗");
    }
  },

  // POST request
  post: async (endpoint: string, data: ApiRequestData, options?: RequestOptions) => {
    try {
      const isFormData = data instanceof FormData;
      const headers = new Headers({
        ...(isFormData ? {} : { "Content-Type": "application/json" }), // Set content type to JSON if not FormData
        ...(options?.headers || {}),
      });
      // Fetch
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: headers, 
        credentials: options?.credentials || "omit",
        body: isFormData ? data : JSON.stringify(data), 
      });
      // Handle response
      return handleResponse(response);
    } catch (error: Error | any) {
      throw new Error(error.message || "提交資料失敗");
    }
  },

  // PATCH request 
  patch: async (endpoint: string, data: Record<string, any>) => {
    try {
      // Fetch
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      // Handle response
      return handleResponse(response);
    } catch (error: Error | any) {
      throw new Error(error.message || "更新資料失敗");
    }
  },

  // // Upload file
  // upload: async (endpoint: string, file:) => {
  //   try {
  //     const formData = new FormData();
  //     formData.append("file", file);

  //     const response = await fetch(`${API_URL}${endpoint}`, {
  //       method: "POST",
  //       body: formData,
  //     });
  //     return handleResponse(response);
  //   } catch (error: Error | any) {
  //     throw new Error(error.message || "上傳檔案失敗");
  //   }
  // },
};
