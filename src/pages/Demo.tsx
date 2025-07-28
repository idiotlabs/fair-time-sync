import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Calendar, Download, Users, Clock, Star, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { downloadICS, openGoogleCalendar, maskEmail, CalendarEvent } from '@/lib/calendar-utils';
import { logEvent } from '@/lib/event-logger';
import { useTranslation } from '@/hooks/useTranslation';
import { updateMetaTags, resetMetaTags } from '@/lib/meta-utils';
import CalendarQATest from '@/components/CalendarQATest';

interface Member {
  id: string;
  display_name: string;
  timezone: string;
  email: string;
}

interface Suggestion {
  id: string;
  starts_at_utc: string;
  ends_at_utc: string;
  attending_member_ids: string[];
  overlap_ratio: number;
  fairness_score: number;
  penalties_json: any;
}

interface SuggestionWithMembers extends Suggestion {
  attendingMembers: Member[];
}

const Demo = () => {
  const { t, locale } = useTranslation();
  const location = useLocation();
  const [suggestions, setSuggestions] = useState<SuggestionWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create locale-aware paths
  const createPath = (path: string) => {
    if (locale === 'ko') {
      return path === '/' ? '/ko' : `/ko${path}`;
    }
    return path;
  };

  useEffect(() => {
    // Update meta tags for demo page
    const isKoreanRoute = location.pathname.startsWith('/ko');
    
    updateMetaTags({
      ogImage: '/og-demo.png',
      ogTitle: 'FairMeet — Live Demo',
      ogDescription: 'See fair meeting time suggestions without signing up.',
      title: isKoreanRoute ? 'FairMeet 데모 — 공정한 회의 시간 추천' : 'FairMeet Demo — Fair Meeting Time Suggestions',
      description: isKoreanRoute ? '시간대별로 공정한 회의 시간을 추천받아보세요. 가입 없이 체험 가능합니다.' : 'Experience fair meeting time recommendations across time zones. Try without signup.',
      ogUrl: `https://fair-time-sync.lovable.app${location.pathname}`
    });

    // Cleanup: reset meta tags when component unmounts
    return () => {
      resetMetaTags();
    };
  }, [location.pathname]);

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      setLoading(true);
      
      // First, ensure sample team exists
      console.log('Creating sample team...');
      const createResponse = await supabase.functions.invoke('create-sample-team');
      
      if (createResponse.error) {
        throw new Error(createResponse.error.message);
      }

      // Get demo data through the dedicated function
      console.log('Getting demo data...');
      const demoResponse = await supabase.functions.invoke('get-demo-data');
      
      if (demoResponse.error) {
        throw new Error(demoResponse.error.message);
      }

      const { data } = demoResponse;
      if (data && data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error('Invalid demo data response');
      }

    } catch (err) {
      console.error('Error loading demo data:', err);
      setError(err instanceof Error ? err.message : '데모 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const generateICS = (suggestion: SuggestionWithMembers) => {
    const event: CalendarEvent = {
      id: suggestion.id,
      teamId: 'sample-team',
      title: t('demo.meeting.title'),
      description: `${t('demo.meeting.description')}.\n\n${t('demo.meeting.duration')}\n${t('demo.meeting.fairnessScore', { score: Math.round(suggestion.fairness_score * 100) })}\n${t('demo.meeting.overlapRatio', { ratio: Math.round(suggestion.overlap_ratio * 100) })}`,
      startTime: new Date(suggestion.starts_at_utc),
      endTime: new Date(suggestion.ends_at_utc),
      attendees: suggestion.attendingMembers.map(member => ({
        name: member.display_name,
        email: member.email
      })),
      location: 'Virtual Meeting'
    };

    downloadICS(event);
    
    // Log the export event
    logEvent({
      eventType: 'slot_exported',
      metadata: {
        format: 'ics',
        suggestionId: suggestion.id,
        attendeeCount: suggestion.attendingMembers.length,
        source: 'demo'
      }
    });
  };

  const generateGoogleCalendarLink = (suggestion: SuggestionWithMembers) => {
    const event: CalendarEvent = {
      id: suggestion.id,
      teamId: 'sample-team',
      title: 'FairMeet — Sample Team Meeting',
      description: `Demo meeting for distributed team collaboration.\n\nMeeting Details:\n- Duration: 45 minutes\n- Fairness Score: ${Math.round(suggestion.fairness_score * 100)}%\n- Overlap Ratio: ${Math.round(suggestion.overlap_ratio * 100)}%`,
      startTime: new Date(suggestion.starts_at_utc),
      endTime: new Date(suggestion.ends_at_utc),
      attendees: suggestion.attendingMembers.map(member => ({
        name: member.display_name,
        email: member.email
      })),
      location: 'Virtual Meeting'
    };

    openGoogleCalendar(event);
    
    // Log the export event
    logEvent({
      eventType: 'slot_exported',
      metadata: {
        format: 'google_calendar',
        suggestionId: suggestion.id,
        attendeeCount: suggestion.attendingMembers.length,
        source: 'demo'
      }
    });
  };

  const formatLocalTime = (utcTime: string, timezone: string) => {
    const date = new Date(utcTime);
    const localeCode = locale === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.DateTimeFormat(localeCode, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <Clock className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-3xl font-bold mb-4">{t('demo.loading')}</h1>
              <p className="text-muted-foreground">
                {t('demo.loadingSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-destructive">{t('demo.errorTitle')}</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={loadDemoData}>{t('demo.retry')}</Button>
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to={createPath('/')}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('demo.backToHome')}
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="text-2xl font-bold text-gradient">FairMeet</span>
            </div>
          </div>
          <Badge variant="secondary">{t('demo.badge')}</Badge>
        </div>
      </header>

      {/* Demo Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              {t('demo.sampleTeamMeeting')}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              {t('demo.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('demo.timezones')}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('demo.meetingDuration')}
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                {t('demo.fairnessEnabled')}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-6">
            {suggestions.map((suggestion, index) => {
              const startTime = new Date(suggestion.starts_at_utc);
              const teamLocalTime = formatLocalTime(suggestion.starts_at_utc, 'UTC');
              
              return (
                <Card key={suggestion.id} className="card-elegant">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <CardTitle className="text-lg">
                          {format(startTime, locale === 'ko' ? 'M월 d일 (E)' : 'MMM d (E)', { locale: locale === 'ko' ? ko : enUS })}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {t('demo.teamTime')}: {teamLocalTime}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Left: Metrics */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-primary/5 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {Math.round(suggestion.overlap_ratio * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t('demo.overlap')}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-green-500/5 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {Math.round(suggestion.fairness_score * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t('demo.fairness')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-blue-500/5 rounded-lg">
                          <div className="text-lg font-semibold text-blue-600">
                            Δ +{Math.round((1 - suggestion.fairness_score) * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('demo.fairnessImprovement')}
                          </div>
                        </div>
                      </div>

                      {/* Right: Attendees and Actions */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">{t('demo.attendees')} ({suggestion.attendingMembers.length}{locale === 'ko' ? '명' : ' members'})</h4>
                          <div className="space-y-2">
                            {suggestion.attendingMembers.map(member => {
                              const memberLocalTime = formatLocalTime(suggestion.starts_at_utc, member.timezone);
                              return (
                                <div key={member.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {member.display_name}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {maskEmail(member.email)}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {memberLocalTime}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => generateICS(suggestion)}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t('demo.downloadICS')}
                          </Button>
                          <Button 
                            onClick={() => generateGoogleCalendarLink(suggestion)}
                            size="sm"
                            className="flex-1"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            {t('demo.addToGoogle')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Calendar QA Testing Section */}
          <div className="mt-12">
            <CalendarQATest />
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12 p-8 bg-primary/5 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">{t('demo.callToActionTitle')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('demo.callToActionDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPath('/auth')}>
                <Button size="lg" className="btn-gradient">
                  {t('demo.startFree')}
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={loadDemoData}>
                {t('demo.generateNew')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;