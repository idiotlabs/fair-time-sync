import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'en' | 'ko';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  initialLocale = 'en' 
}) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for a specific locale
  const loadTranslations = async (targetLocale: Locale) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/locales/${targetLocale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${targetLocale}`);
      }
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English if loading fails
      if (targetLocale !== 'en') {
        await loadTranslations('en');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize locale from URL or localStorage
  useEffect(() => {
    const pathname = window.location.pathname;
    let detectedLocale: Locale = 'en';

    // Check if URL starts with /ko
    if (pathname.startsWith('/ko')) {
      detectedLocale = 'ko';
    } else {
      // Check localStorage for saved preference
      const savedLocale = localStorage.getItem('fm_locale') as Locale;
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'ko')) {
        detectedLocale = savedLocale;
      }
    }

    setLocaleState(detectedLocale);
    loadTranslations(detectedLocale);
  }, []);

  // Update translations when locale changes
  useEffect(() => {
    if (locale) {
      loadTranslations(locale);
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('fm_locale', newLocale);
    
    // Update URL path
    const currentPath = window.location.pathname;
    let newPath = currentPath;

    // Remove existing locale prefix
    if (currentPath.startsWith('/ko')) {
      newPath = currentPath.slice(3) || '/';
    }

    // Add new locale prefix if not English
    if (newLocale === 'ko') {
      newPath = '/ko' + newPath;
    }

    // Navigate to new path
    if (newPath !== currentPath) {
      window.history.pushState({}, '', newPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Translation function with nested key support
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;

    // Navigate through nested object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return key as fallback
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Replace parameters if provided
    if (params) {
      return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
        return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      }, value);
    }

    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};