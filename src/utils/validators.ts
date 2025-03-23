import { Translation } from '@/types';

export const createValidators = (lang: { tr: Translation }) => ({
  validateAccount: (value: string): string => {
    value = value.trim();
    if (!value) return lang.tr.accountRequired;
    if (value.length < 4) return lang.tr.accountMinLength;
    if (value.length > 16) return lang.tr.accountMaxLength;
    if (!/^[A-Za-z0-9_\.]+$/.test(value)) return lang.tr.accountInvalidFormat;
    return '';
  },

  validatePassword: (value: string): string => {
    value = value.trim();
    if (!value) return lang.tr.passwordRequired;
    if (value.length < 8) return lang.tr.passwordMinLength;
    if (value.length > 20) return lang.tr.passwordMaxLength;
    if (!/^[A-Za-z0-9@$!%*#?&]{8,20}$/.test(value))
      return lang.tr.passwordInvalidFormat;
    return '';
  },

  validateUsername: (value: string): string => {
    value = value.trim();
    if (!value) return lang.tr.usernameRequired;
    if (value.length < 1) return lang.tr.usernameMinLength;
    if (value.length > 32) return lang.tr.usernameMaxLength;
    return '';
  },

  validateCheckPassword: (value: string, check: string): string => {
    if (value !== check) return lang.tr.passwordsDoNotMatch;
    return '';
  },
});
