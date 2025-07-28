import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Clock, Users, Calendar } from 'lucide-react';
import { updateMetaTags, resetMetaTags } from '@/lib/meta-utils';
import { useTranslation } from '@/hooks/useTranslation';

interface ShareData {
  team_name: string;
  suggestions: any[];
}

const ShareView = () => {
  const { token } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update meta tags for share page
    updateMetaTags({
      title: 'FairMeet — Shared Suggestions',
      description: 'Review fair meeting time suggestions. No signup required.',
      ogTitle: 'FairMeet — Shared Suggestions',
      ogDescription: 'Review fair meeting time suggestions. No signup required.',
      ogImage: '/og-cover-en.png',
      ogUrl: `https://fair-time-sync.lovable.app${location.pathname}`
    });

    // Cleanup: reset meta tags when component unmounts
    return () => {
      resetMetaTags();
    };
  }, [location.pathname]);

  useEffect(() => {
    fetchShareData();
  }, [token]);

  const fetchShareData = async () => {
    try {
      // This would require a special edge function or RLS policy for public access
      // For now, showing the UI structure
      setShareData({
        team_name: 'Sample Team',
        suggestions: []
      });
    } catch (error: any) {
      setError(t('share.notFound') || 'Shared link not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('share.linkNotFound') || 'Link not found'}</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">FairMeet</span>
            <Badge variant="secondary">{t('share.sharedLink') || 'Shared Link'}</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{shareData?.team_name}</h1>
          <p className="text-muted-foreground">
            {t('share.description') || 'Review meeting time suggestions.'}
          </p>
        </div>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{t('share.suggestedTimes') || 'Suggested Meeting Times'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('share.noSuggestions') || 'No suggestions available'}</h3>
              <p className="text-muted-foreground">
                {t('share.noSuggestionsDesc') || 'No meeting time suggestions have been generated yet.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          Powered by <span className="text-gradient font-semibold">FairMeet</span>
        </div>
      </div>
    </div>
  );
};

export default ShareView;