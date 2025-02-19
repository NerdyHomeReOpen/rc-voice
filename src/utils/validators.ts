
export const validateAccount = (value: string): string => {
  value = value.trim();
  if (!value) return '帳號為必填';
  if (value.length < 4) return '帳號至少需要 4 個字';
  if (value.length > 16) return '帳號最多 16 個字';
  if (!/^[A-Za-z0-9_\.]+$/.test(value))
    return '帳號只能使用英文、數字、底線(_)和點(.)';
  return '';
};
export const validatePassword = (value: string): string => {
  value = value.trim();
  if (!value) return '密碼為必填';
  if (value.length < 8) return '密碼至少需要 8 個字';
  if (value.length > 20) return '密碼最多 20 個字';
  if (!/^[A-Za-z0-9@$!%*#?&]{8,20}$/.test(value))
    return '密碼長度需要在8-20個字之間，且不包含@$!%*#?&以外的特殊字元';
  return '';
};
export const validateUsername = (value: string): string => {
  value = value.trim();
  if (!value) return '顯示名稱為必填';
  if (value.length < 1) return '顯示名稱至少需要 1 個字';
  if (value.length > 32) return '顯示名稱最多 32 個字';
  return '';
};