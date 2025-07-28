import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const LanguageBanner = () => {
  const { locale, setLocale, t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only show banner on first visit to English pages for Korean users
    const hasSeenBanner = localStorage.getItem('fm_language_banner_dismissed');
    const isFirstVisit = !localStorage.getItem('fm_locale');
    const userLanguage = navigator.language.toLowerCase();
    const isKoreanUser = userLanguage.startsWith('ko');
    
    // Show banner if:
    // 1. Currently on English page
    // 2. User's browser language is Korean
    // 3. First visit (no saved locale preference)
    // 4. Haven't dismissed the banner before
    if (locale === 'en' && isKoreanUser && isFirstVisit && !hasSeenBanner) {
      setIsVisible(true);
    }
  }, [locale]);

  const handleAccept = () => {
    setLocale('ko');
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('fm_language_banner_dismissed', 'true');
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-900 dark:text-blue-100">
              {t('language.suggestion')}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAccept}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('language.yes')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300"
              >
                {t('language.no')}
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LanguageBanner;