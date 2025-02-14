// Services
import { apiService, base64encode } from "@/services/api.service";

interface LoginFormData {
  account: string;
  password: string;
  rememberAccount: boolean;
  autoLogin: boolean;
}

interface RegisterFormData {
  account: string;
  password: string;
  username: string;
  gender: "Male" | "Female";
}

export const authService = {
  login: async (formData: LoginFormData) => {
    const loginData = {
      ...formData,
      password: base64encode(formData.password),
    };
    return apiService.post("/login", loginData);
  },

  register: async (formData: RegisterFormData) => {
    const registerData = {
      ...formData,
      password: base64encode(formData.password),
    };
    return apiService.post("/register", registerData);
  },
};

export default authService;
