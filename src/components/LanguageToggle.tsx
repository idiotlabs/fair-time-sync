import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const LanguageToggle = () => {
  const { locale, setLocale, t } = useTranslation();

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ko' : 'en';
    setLocale(newLocale);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      aria-label={t('language.switchTo')}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {locale === 'en' ? '한국어' : 'English'}
      </span>
    </Button>
  );
};

export default LanguageToggle;