import { useI18n } from '@/contexts/I18nContext';

export const useTranslation = () => {
  const { t, locale, setLocale, isLoading } = useI18n();
  
  return {
    t,
    locale,
    setLocale,
    isLoading,
    // Utility functions
    isKorean: locale === 'ko',
    isEnglish: locale === 'en',
    // Date formatting based on locale
    formatTime: (date: Date): string => {
      if (locale === 'ko') {
        return date.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
    },
    formatDate: (date: Date): string => {
      if (locale === 'ko') {
        return date.toLocaleDateString('ko-KR');
      } else {
        return date.toLocaleDateString('en-US');
      }
    },
    formatDateTime: (date: Date): string => {
      if (locale === 'ko') {
        return date.toLocaleString('ko-KR', { 
          hour12: false,
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return date.toLocaleString('en-US', { 
          hour12: true,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      }
    }
  };
};