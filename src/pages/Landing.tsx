import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Clock, Users, Zap, Shield, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageToggle from '@/components/LanguageToggle';

const Landing = () => {
  const { t, locale } = useTranslation();
  
  // Create locale-aware links
  const createPath = (path: string) => {
    if (locale === 'ko') {
      return path === '/' ? '/ko' : `/ko${path}`;
    }
    return path;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-8 w-8 text-primary" aria-hidden="true" />
            <span className="text-2xl font-bold text-gradient">FairMeet</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.features')}
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.pricing')}
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.faq')}
            </a>
            <Link to={createPath('/auth')}>
              <Button variant="outline">{t('nav.login')}</Button>
            </Link>
            <Link to={createPath('/auth')}>
              <Button className="btn-gradient">{t('nav.getStarted')}</Button>
            </Link>
            <LanguageToggle />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          {t('hero.badge')}
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          {t('hero.title')}
          <span className="text-gradient block">{t('hero.titleHighlight')}</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('hero.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPath('/auth')}>
            <Button size="lg" className="btn-gradient text-lg px-8">
              {t('hero.cta')}
            </Button>
          </Link>
          <Link to={createPath('/demo')}>
            <Button size="lg" variant="outline" className="text-lg px-8">
              {t('hero.demo')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('features.title')}</h2>
          <p className="text-xl text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="card-elegant">
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>{t('features.smartRecommendations.title')}</CardTitle>
              <CardDescription>
                {t('features.smartRecommendations.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>{t('features.fairnessScore.title')}</CardTitle>
              <CardDescription>
                {t('features.fairnessScore.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>{t('features.rotationSystem.title')}</CardTitle>
              <CardDescription>
                {t('features.rotationSystem.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Globe className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>{t('features.multiTimezone.title')}</CardTitle>
              <CardDescription>
                {t('features.multiTimezone.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>{t('features.calendarIntegration.title')}</CardTitle>
              <CardDescription>
                {t('features.calendarIntegration.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Star className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>{t('features.teamSharing.title')}</CardTitle>
              <CardDescription>
                {t('features.teamSharing.description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('pricing.title')}</h2>
          <p className="text-xl text-muted-foreground">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>{t('pricing.free.title')}</CardTitle>
              <CardDescription>{t('pricing.free.description')}</CardDescription>
              <div className="text-3xl font-bold">
                {t('pricing.free.price')}
                <span className="text-sm font-normal">{t('pricing.free.period')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• {t('pricing.free.features.0')}</li>
                <li>• {t('pricing.free.features.1')}</li>
                <li>• {t('pricing.free.features.2')}</li>
                <li>• {t('pricing.free.features.3')}</li>
              </ul>
              <Button className="w-full mt-6" variant="outline">{t('pricing.free.cta')}</Button>
            </CardContent>
          </Card>

          <Card className="card-elegant border-primary">
            <CardHeader>
              <Badge className="mb-2">{t('pricing.pro.popular')}</Badge>
              <CardTitle>{t('pricing.pro.title')}</CardTitle>
              <CardDescription>{t('pricing.pro.description')}</CardDescription>
              <div className="text-3xl font-bold">
                {t('pricing.pro.price')}
                <span className="text-sm font-normal">{t('pricing.pro.period')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• {t('pricing.pro.features.0')}</li>
                <li>• {t('pricing.pro.features.1')}</li>
                <li>• {t('pricing.pro.features.2')}</li>
                <li>• {t('pricing.pro.features.3')}</li>
                <li>• {t('pricing.pro.features.4')}</li>
              </ul>
              <Button className="w-full mt-6 btn-gradient">{t('pricing.pro.cta')}</Button>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>{t('pricing.team.title')}</CardTitle>
              <CardDescription>{t('pricing.team.description')}</CardDescription>
              <div className="text-3xl font-bold">
                {t('pricing.team.price')}
                <span className="text-sm font-normal">{t('pricing.team.period')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• {t('pricing.team.features.0')}</li>
                <li>• {t('pricing.team.features.1')}</li>
                <li>• {t('pricing.team.features.2')}</li>
                <li>• {t('pricing.team.features.3')}</li>
                <li>• {t('pricing.team.features.4')}</li>
              </ul>
              <Button className="w-full mt-6" variant="outline">{t('pricing.team.cta')}</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('faq.title')}</h2>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('faq.questions.fairness.q')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('faq.questions.fairness.a')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('faq.questions.calendars.q')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('faq.questions.calendars.a')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('faq.questions.freeLimits.q')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('faq.questions.freeLimits.a')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Globe className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-lg font-bold">FairMeet</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">{t('footer.privacyPolicy')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('footer.termsOfService')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('footer.support')}</a>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-4">
            {t('footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;