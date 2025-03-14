import { useLanguage } from '@/contexts/LanguageContext';
import { Translations } from '@/types';

export const useTranslation = (): Translations => {
  const { translations } = useLanguage();
  return translations;
};
