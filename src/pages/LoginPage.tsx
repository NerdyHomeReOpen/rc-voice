import React, { useState, ChangeEvent, FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';

// Services
import authService from '@/services/auth.service';

// Types
import type { User } from '@/types';

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

interface FormErrors {
  general?: string;
  account?: string;
  password?: string;
  username?: string;
}

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  showDropdown?: boolean;
}

interface LoginFormProps {
  form: LoginFormData;
  errors: FormErrors;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

interface RegisterFormProps {
  form: RegisterFormData;
  errors: FormErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

// Input Field Component
const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  showDropdown = false,
}) => (
  <div className="mb-4">
    <label className="block text-sm mb-1">
      {label}
      <span className="text-red-500 ml-1">*</span>
    </label>
    <div className="relative flex items-center">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-2 border rounded ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {showDropdown && (
        <div className="absolute right-2 pointer-events-none">
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      )}
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Login Form Component
const LoginForm: React.FC<LoginFormProps> = React.memo(
  ({ form, errors, onChange, onSubmit }) => (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      {errors.general && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <InputField
        label="帳號"
        name="account"
        value={form.account}
        onChange={onChange}
        placeholder="請輸入帳號"
        error={errors.account}
        showDropdown
      />

      <InputField
        label="密碼"
        name="password"
        type="password"
        value={form.password}
        onChange={onChange}
        placeholder="請輸入密碼"
        error={errors.password}
      />

      <div className="flex justify-between mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberAccount"
            checked={form.rememberAccount}
            onChange={onChange}
            className="mr-2"
          />
          <span className="text-sm">記住帳號</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="autoLogin"
            checked={form.autoLogin}
            onChange={onChange}
            className="mr-2"
          />
          <span className="text-sm">自動登入</span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
      >
        登入
      </button>
    </form>
  ),
);

// Register Form Component
const RegisterForm: React.FC<RegisterFormProps> = React.memo(
  ({ form, errors, onChange, onSubmit }) => (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      {errors.general && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <InputField
        label="帳號"
        name="account"
        value={form.account}
        onChange={onChange}
        placeholder="請輸入帳號"
        error={errors.account}
      />

      <InputField
        label="密碼"
        name="password"
        type="password"
        value={form.password}
        onChange={onChange}
        placeholder="請輸入密碼"
        error={errors.password}
      />

      <InputField
        label="顯示名稱"
        name="username"
        value={form.username}
        onChange={onChange}
        placeholder="請輸入顯示名稱"
        error={errors.username}
      />

      {/* Gender Selection */}
      <div className="mb-4">
        <label className="block text-sm mb-1">
          性別
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative flex items-center">
          <select
            name="gender"
            value={form.gender}
            onChange={onChange}
            className="w-full p-2 border rounded border-gray-300"
          >
            <option value="Male">男性</option>
            <option value="Female">女性</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
      >
        註冊
      </button>
    </form>
  ),
);

// Validation functions
const validateAccount = (value: string): string => {
  value = value.trim();
  if (!value) return '帳號為必填';
  if (value.length < 4) return '帳號至少需要 4 個字';
  if (value.length > 16) return '帳號最多 16 個字';
  if (!/^[A-Za-z0-9_\.]+$/.test(value))
    return '帳號只能使用英文、數字、底線(_)和點(.)';
  return '';
};

const validatePassword = (value: string): string => {
  value = value.trim();
  if (!value) return '密碼為必填';
  if (value.length < 8) return '密碼至少需要 8 個字';
  if (value.length > 20) return '密碼最多 20 個字';
  if (!/^[A-Za-z0-9@$!%*#?&]{8,20}$/.test(value))
    return '密碼長度需要在8-20個字之間，且不包含@$!%*#?&以外的特殊字元';
  return '';
};

const validateUsername = (value: string): string => {
  value = value.trim();
  if (!value) return '顯示名稱為必填';
  if (value.length < 1) return '顯示名稱至少需要 1 個字';
  if (value.length > 32) return '顯示名稱最多 32 個字';
  return '';
};

// Main Auth Page Component
const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});

  const [loginForm, setLoginForm] = useState<LoginFormData>({
    account: '',
    password: '',
    rememberAccount: false,
    autoLogin: false,
  });

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    account: '',
    password: '',
    username: '',
    gender: 'Male',
  });

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'account') {
      setLoginErrors((prev) => ({
        ...prev,
        account: validateAccount(value),
      }));
    } else if (name === 'password') {
      setLoginErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
      }));
    }
  };

  const handleRegisterChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'account') {
      setRegisterErrors((prev) => ({
        ...prev,
        account: validateAccount(value),
      }));
    } else if (name === 'password') {
      setRegisterErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
      }));
    } else if (name === 'username') {
      setRegisterErrors((prev) => ({
        ...prev,
        username: validateUsername(value),
      }));
    }
  };

  const handleLoginSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    const accountError = validateAccount(loginForm.account);
    const passwordError = validatePassword(loginForm.password);

    setLoginErrors({
      account: accountError,
      password: passwordError,
    });

    if (!accountError && !passwordError) {
      try {
        const data = await authService.login(loginForm);
        onLoginSuccess(data.user);
      } catch (error) {
        setLoginErrors({
          general: error instanceof Error ? error.message : '登入失敗',
        });
      }
    }
  };

  const handleRegisterSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    const accountError = validateAccount(registerForm.account);
    const passwordError = validatePassword(registerForm.password);
    const usernameError = validateUsername(registerForm.username);

    setRegisterErrors({
      account: accountError,
      password: passwordError,
      username: usernameError,
    });

    if (!accountError && !passwordError && !usernameError) {
      try {
        await authService.register(registerForm);
        setIsLogin(true);
      } catch (error) {
        setRegisterErrors({
          general: error instanceof Error ? error.message : '註冊失敗',
        });
      }
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col items-center pt-10 px-8">
        <img src="/login_logo.png" alt="RiceCall Logo" className="mb-8" />

        {isLogin ? (
          <LoginForm
            form={loginForm}
            errors={loginErrors}
            onChange={handleLoginChange}
            onSubmit={handleLoginSubmit}
          />
        ) : (
          <RegisterForm
            form={registerForm}
            errors={registerErrors}
            onChange={handleRegisterChange}
            onSubmit={handleRegisterSubmit}
          />
        )}

        <div className="flex justify-between w-full max-w-sm mt-4">
          <button
            className="text-sm text-gray-600 hover:text-blue-500"
            onClick={() => {
              setIsLogin(!isLogin);
              setLoginErrors({});
              setRegisterErrors({});
            }}
          >
            {isLogin ? '註冊帳號' : '返回登入'}
          </button>
        </div>
      </div>
    </>
  );
};

AuthPage.displayName = 'AuthPage';

export default AuthPage;
