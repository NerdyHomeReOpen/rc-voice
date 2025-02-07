import React, { useState, ChangeEvent, FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';

// Services
import authService from '@/services/auth.service';

// Types
import type { User } from '@/types';

// Validation
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

// Input Field Component
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
const InputField: React.FC<InputFieldProps> = React.memo(
  ({
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
  ),
);
InputField.displayName = 'InputField';

interface FormErrors {
  general?: string;
  account?: string;
  password?: string;
  username?: string;
}

// Login Form Component
interface LoginFormData {
  account: string;
  password: string;
  rememberAccount: boolean;
  autoLogin: boolean;
}
interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}
const LoginForm: React.FC<LoginFormProps> = React.memo(({ onLoginSuccess }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    account: '',
    password: '',
    rememberAccount: false,
    autoLogin: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: any): void => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'account') {
      setErrors((prev) => ({
        ...prev,
        account: validateAccount(value),
      }));
    } else if (name === 'password') {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const accountError = validateAccount(formData.account);
    const passwordError = validatePassword(formData.password);

    setErrors({
      account: accountError,
      password: passwordError,
    });

    if (!accountError && !passwordError) {
      try {
        const data = await authService.login(formData);
        onLoginSuccess(data.user as User);
      } catch (error) {
        setErrors({
          general: error instanceof Error ? error.message : '登入失敗',
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      {errors.general && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}
      <InputField
        label="帳號"
        name="account"
        value={formData.account}
        onChange={handleInputChange}
        placeholder="請輸入帳號"
        error={errors.account}
        showDropdown
      />
      <InputField
        label="密碼"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleInputChange}
        placeholder="請輸入密碼"
        error={errors.password}
      />
      <div className="flex justify-between mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberAccount"
            checked={formData.rememberAccount}
            onChange={handleInputChange}
            className="mr-2"
          />
          <span className="text-sm">記住帳號</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="autoLogin"
            checked={formData.autoLogin}
            onChange={handleInputChange}
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
  );
});
LoginForm.displayName = 'LoginForm';

// Register Form Component
interface RegisterFormData {
  account: string;
  password: string;
  username: string;
  gender: 'Male' | 'Female';
}
interface RegisterFormProps {
  onRegisterSuccess: () => void;
}
const RegisterForm: React.FC<RegisterFormProps> = React.memo(
  ({ onRegisterSuccess }) => {
    const [formData, setFormData] = useState<RegisterFormData>({
      account: '',
      password: '',
      username: '',
      gender: 'Male',
    });
    const [errors, setErrors] = useState<FormErrors>({});

    const handleInputChange = (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ): void => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === 'account') {
        setFormData((prev) => ({
          ...prev,
          account: validateAccount(value),
        }));
      } else if (name === 'password') {
        setFormData((prev) => ({
          ...prev,
          password: validatePassword(value),
        }));
      } else if (name === 'username') {
        setFormData((prev) => ({
          ...prev,
          username: validateUsername(value),
        }));
      }
    };

    const handleSubmit = async (
      e: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
      e.preventDefault();
      const accountError = validateAccount(formData.account);
      const passwordError = validatePassword(formData.password);
      const usernameError = validateUsername(formData.username);

      setErrors({
        account: accountError,
        password: passwordError,
        username: usernameError,
      });

      if (!accountError && !passwordError && !usernameError) {
        try {
          await authService.register(formData);
          onRegisterSuccess();
        } catch (error) {
          setErrors({
            general: error instanceof Error ? error.message : '註冊失敗',
          });
        }
      }
    };

    return (
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        {errors.general && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}
        <InputField
          label="帳號"
          name="account"
          value={formData.account}
          onChange={handleInputChange}
          placeholder="請輸入帳號"
          error={errors.account}
        />
        <InputField
          label="密碼"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="請輸入密碼"
          error={errors.password}
        />
        <InputField
          label="顯示名稱"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
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
              value={formData.gender}
              onChange={handleInputChange}
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
    );
  },
);
RegisterForm.displayName = 'RegisterForm';

// Main Auth Page Component
interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}
const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);

  return (
    <>
      <div className="flex flex-1 flex-col items-center pt-10 px-8">
        <img src="/login_logo.png" alt="RiceCall Logo" className="mb-8" />

        {isLogin ? (
          <LoginForm onLoginSuccess={onLoginSuccess} />
        ) : (
          <RegisterForm onRegisterSuccess={() => setIsLogin(true)} />
        )}

        <div className="flex justify-between w-full max-w-sm mt-4">
          <button
            className="text-sm text-gray-600 hover:text-blue-500"
            onClick={() => {
              setIsLogin(!isLogin);
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
