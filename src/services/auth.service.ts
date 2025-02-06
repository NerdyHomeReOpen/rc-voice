import { apiService, base64encode } from "./api.service";

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
  login: async (credentials: LoginFormData) => {
    const loginData = {
      ...credentials,
      password: base64encode(credentials.password),
    };
    return apiService.post("/login", loginData);
  },

  register: async (userData: RegisterFormData) => {
    const registerData = {
      ...userData,
      password: base64encode(userData.password),
    };
    return apiService.post("/register", registerData);
  },
};

export default authService;
