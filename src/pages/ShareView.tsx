import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Clock, Users, Calendar, Download, ExternalLink, LogIn } from 'lucide-react';
import { updateMetaTags, resetMetaTags } from '@/lib/meta-utils';
import { useTranslation } from '@/hooks/useTranslation';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface ShareData {
  team_name: string;
  suggestions: any[];
  default_timezone?: string;
}

const maskEmail = (email: string) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? 
    local.slice(0, 2) + '*'.repeat(local.length - 2) : 
    local;
  return `${maskedLocal}@${domain}`;
};

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
      if (!token) {
        setError(t('share.notFound') || 'Shared link not found.');
        return;
      }

      // Fetch share link data with public access
      const { data: shareLink, error: shareLinkError } = await supabase
        .from('share_links')
        .select(`
          id,
          team_id,
          expires_at,
          is_active,
          teams!inner (
            name,
            default_timezone
          )
        `)
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (shareLinkError || !shareLink) {
        setError(t('share.notFound') || 'Shared link not found.');
        return;
      }

      // Check if link has expired
      if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
        setError(t('share.expired') || 'This shared link has expired.');
        return;
      }

      // Fetch suggestions for this team
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('suggestions')
        .select(`
          *,
          team_members!inner (
            id,
            display_name,
            email,
            timezone
          )
        `)
        .eq('team_id', shareLink.team_id)
        .order('fairness_score', { ascending: false });

      if (suggestionsError) {
        console.error('Error fetching suggestions:', suggestionsError);
        setError(t('share.errorLoading') || 'Error loading suggestions.');
        return;
      }

      setShareData({
        team_name: shareLink.teams.name,
        suggestions: suggestions || [],
        default_timezone: shareLink.teams.default_timezone || 'UTC'
      });
    } catch (error: any) {
      console.error('Error fetching share data:', error);
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

        {shareData.suggestions && shareData.suggestions.length > 0 ? (
          <div className="space-y-4">
            {shareData.suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="card-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {format(toZonedTime(new Date(suggestion.starts_at_utc), shareData.default_timezone || 'UTC'), 'MMM dd, yyyy HH:mm')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {shareData.default_timezone || 'UTC'} timezone
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {Math.round(suggestion.overlap_ratio * 100)}% overlap
                      </Badge>
                      <Badge variant="outline">
                        Fairness: {suggestion.fairness_score?.toFixed(2) || '0.00'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Member badges */}
                    <div className="flex flex-wrap gap-2">
                      {suggestion.attending_member_ids?.slice(0, 3).map((memberId: string) => {
                        const member = suggestion.team_members?.find((m: any) => m.id === memberId);
                        if (!member) return null;
                        const memberLocalTime = toZonedTime(new Date(suggestion.starts_at_utc), member.timezone);
                        return (
                          <Badge key={memberId} variant="outline" className="text-xs">
                            {member.display_name} ({format(memberLocalTime, 'HH:mm')})
                          </Badge>
                        );
                      })}
                      {suggestion.attending_member_ids?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{suggestion.attending_member_ids.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const startUtc = new Date(suggestion.starts_at_utc);
                          const endUtc = new Date(suggestion.ends_at_utc);
                          
                          const icsContent = [
                            'BEGIN:VCALENDAR',
                            'VERSION:2.0',
                            'PRODID:-//FairMeet//Calendar//EN',
                            'BEGIN:VEVENT',
                            `UID:${suggestion.team_id}-${suggestion.id}-${Date.now()}@fairmeet`,
                            `DTSTART:${startUtc.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                            `DTEND:${endUtc.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                            'SUMMARY:FairMeet — Team Meeting',
                            `DESCRIPTION:Team: ${shareData.team_name}\\nAttendees: ${suggestion.attending_member_ids?.map((id: string) => {
                              const member = suggestion.team_members?.find((m: any) => m.id === id);
                              return member ? `${member.display_name} (${maskEmail(member.email || '')})` : '';
                            }).filter(Boolean).join(', ') || 'N/A'}`,
                            'END:VEVENT',
                            'END:VCALENDAR'
                          ].join('\r\n');

                          const blob = new Blob([icsContent], { type: 'text/calendar' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `fairmeet-${format(startUtc, 'yyyy-MM-dd-HHmm')}.ics`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export ICS
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const startUtc = new Date(suggestion.starts_at_utc);
                          const endUtc = new Date(suggestion.ends_at_utc);
                          const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('FairMeet — Team Meeting')}&dates=${startUtc.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endUtc.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(`Team: ${shareData.team_name}\nGenerated by FairMeet`)}`;
                          window.open(googleUrl, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Google Cal
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.location.href = '/'}
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Open in app
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
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
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          Powered by <span className="text-gradient font-semibold">FairMeet</span>
        </div>
      </div>
    </div>
  );
};

export default ShareView;