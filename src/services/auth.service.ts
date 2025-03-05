// Services
import { apiService } from '@/services/api.service';
import { ipcService } from '@/services/ipc.service';

// Utils
import { base64encode } from '@/utils/base64encode';

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
  gender: 'Male' | 'Female';
}

export const authService = {
  login: async (formData: LoginFormData) => {
    try {
      if (formData.autoLogin)
        localStorage.setItem('autoLogin', 'true');
      else
        localStorage.setItem('autoLogin', 'false');
      if (formData.rememberAccount)
        localStorage.setItem('account', formData.account);
      else
        localStorage.removeItem('account');

      const loginData = {
        ...formData,
        password: base64encode(formData.password),
      };
      const response = await apiService.post('/login', loginData);

      if (!response || !response.token) throw new Error('伺服器無回應');
        
      localStorage.setItem('token', response.token);
      console.log('Login with token:', response.token);
      ipcService.auth.login(response.token);

      return true;
    } catch (error) {
      return false;
    }
  },

  register: async (formData: RegisterFormData) => {
    try{
      const registerData = {
        ...formData,
        password: base64encode(formData.password),
      };
      const response = await apiService.post('/register', registerData);

      if (!response) 
        throw new Error('伺服器無回應');

      return true;
    }catch (error) {
      return false;
    }
  },

  logout: () => {
    try{
      localStorage.removeItem('token');
      localStorage.removeItem('autoLogin');
      ipcService.auth.logout();

      return true;
    }catch (error) {
      return false;
    }
  },

  isAutoLoginEnabled: () => {
    return localStorage.getItem('autoLogin') === 'true';
  },

  isRememberAccountEnabled: () => {
    return localStorage.getItem('account') !== null;
  },

  autoLogin: async () => {
    const autoLogin = localStorage.getItem('autoLogin') === 'true';
    const token = localStorage.getItem('token');

    if (!autoLogin || !token) return false;

    console.log('Auto login with token:', token);
    ipcService.auth.login(token);

    return true;
  },
};

export default authService;
