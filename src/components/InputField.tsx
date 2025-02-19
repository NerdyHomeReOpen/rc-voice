import React, { ChangeEvent, FocusEvent, useState } from 'react';
import { Eye, EyeClosed, ChevronDown } from 'lucide-react';

// CSS
import styles from '@/styles/inputField.module.css';

interface InputFieldProps {
  name?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  showFunctionButton?: string;
  style?: React.CSSProperties;
}

const InputField: React.FC<InputFieldProps> = React.memo(
  ({
    name,
    value,
    onChange,
    onBlur,
    type = 'text',
    placeholder,
    showFunctionButton = '',
    style,
  }) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = name === 'password'; // 確認是否為密碼欄位

    return (
      <input
        type={isPasswordField && !showPassword ? 'password' : 'text'}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={styles['input']}
        style={{ ...style }}
      />
    );
  },
);

InputField.displayName = 'InputField';

export default InputField;
