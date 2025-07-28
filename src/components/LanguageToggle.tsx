import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const LanguageToggle = () => {
  const { locale, setLocale, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ko' : 'en';
    
    // Save to localStorage
    localStorage.setItem('fm_locale', newLocale);
    
    // Calculate new path
    const currentPath = location.pathname;
    let newPath: string;
    
    if (newLocale === 'ko') {
      // Switch to Korean: add /ko prefix
      newPath = currentPath.startsWith('/ko') ? currentPath : `/ko${currentPath === '/' ? '' : currentPath}`;
    } else {
      // Switch to English: remove /ko prefix
      newPath = currentPath.startsWith('/ko') ? currentPath.slice(3) || '/' : currentPath;
    }
    
    // Navigate to equivalent page and update locale
    navigate(newPath);
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