import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Settings, Share, Calendar, Plus, Edit, Trash2, Download, Copy, ExternalLink, Filter, CalendarDays } from 'lucide-react';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import MemberForm from '@/components/MemberForm';
import RulesForm from '@/components/RulesForm';

interface Team {
  id: string;
  name: string;
  slug: string;
  locale: string;
  default_timezone: string;
}

interface TeamMember {
  id: string;
  display_name: string;
  email: string;
  role: string;
  timezone: string;
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

const TeamDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generatingsuggestions, setGeneratingSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'fairness'>('score');
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);
  const [rules, setRules] = useState<any>(null);
  const [creatingShareLink, setCreatingShareLink] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTeamData();
    fetchSuggestions();
    fetchRules();
  }, [user, slug, navigate]);

  const fetchTeamData = async () => {
    try {
      // Fetch team info and user's role
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('slug', slug)
        .single();

      if (teamError) throw teamError;

      // Check if user is a member of this team
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamData.id)
        .eq('user_id', user?.id)
        .single();

      if (memberError) {
        toast({
          title: "접근 권한 없음",
          description: "이 팀에 접근할 권한이 없습니다.",
          variant: "destructive",
        });
        navigate('/app');
        return;
      }

      setTeam(teamData);
      setUserRole(memberData.role);

      // Fetch all team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamData.id)
        .order('created_at');

      if (membersError) throw membersError;
      setMembers(membersData);

    } catch (error: any) {
      toast({
        title: "팀 정보 로드 실패",
        description: error.message,
        variant: "destructive",
      });
      navigate('/app');
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    if (!team) return;
    
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('team_id', team?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setRules(data);
    } catch (error: any) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchSuggestions = async () => {
    if (!team) return;
    
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('team_id', team?.id)
        .order('fairness_score', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const generateSuggestions = async () => {
    if (!team) return;
    
    try {
      setGeneratingSuggestions(true);
      const { data, error } = await supabase.functions.invoke('generate-suggestions', {
        body: { teamId: team.id }
      });

      if (error) throw error;

      toast({
        title: "추천 생성 완료",
        description: `${data.suggestions}개의 회의 시간이 추천되었습니다.`,
      });

      // Refresh suggestions
      fetchSuggestions();
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "추천 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const createShareLink = async () => {
    if (!team) return;
    
    try {
      setCreatingShareLink(true);
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: { teamId: team.id }
      });

      if (error) throw error;

      setShareLink(data.shareLink);
      toast({
        title: "공유 링크 생성됨",
        description: "링크가 클립보드에 복사되었습니다.",
      });

      // Copy to clipboard
      await navigator.clipboard.writeText(data.shareLink);
    } catch (error: any) {
      console.error('Error creating share link:', error);
      toast({
        title: "공유 링크 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingShareLink(false);
    }
  };

  const formatTimeForTeam = (utcTime: string, timezone: string) => {
    try {
      return formatInTimeZone(new Date(utcTime), timezone, 'MMM d, HH:mm');
    } catch (error) {
      return new Date(utcTime).toLocaleString();
    }
  };

  const getMembersByIds = (memberIds: string[]) => {
    return members.filter(member => memberIds.includes(member.id));
  };

  const calculateScore = (suggestion: Suggestion) => {
    const penalties = suggestion.penalties_json;
    return suggestion.overlap_ratio - (penalties.night_penalties + penalties.burden_penalties + penalties.adjacency_penalties);
  };

  const getSortedAndFilteredSuggestions = () => {
    let filtered = suggestions;

    if (showRequiredOnly && rules?.required_member_ids?.length > 0) {
      filtered = suggestions.filter(suggestion => 
        rules.required_member_ids.every((reqId: string) => 
          suggestion.attending_member_ids.includes(reqId)
        )
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return calculateScore(b) - calculateScore(a);
        case 'time':
          return new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime();
        case 'fairness':
          return b.fairness_score - a.fairness_score;
        default:
          return 0;
      }
    });
  };

  const handleExportICS = (suggestion: Suggestion) => {
    const startDate = new Date(suggestion.starts_at_utc);
    const endDate = new Date(suggestion.ends_at_utc);
    const attendingMembers = getMembersByIds(suggestion.attending_member_ids);
    
    const formatDateUTC = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const foldLine = (line: string) => {
      if (line.length <= 75) return line;
      
      let folded = '';
      let remaining = line;
      
      while (remaining.length > 75) {
        folded += remaining.substring(0, 75) + '\r\n ';
        remaining = remaining.substring(75);
      }
      folded += remaining;
      
      return folded;
    };

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${team?.id}-${suggestion.id}-${timestamp}@fairmeet.com`;
    
    const attendeesList = attendingMembers.map(member => 
      `${member.display_name} (${member.email?.replace(/(.{1,2}).*@/, '$1***@') || 'no-email'})`
    ).join(', ');

    const description = `공정한 회의 시간 추천\\n\\n` +
      `참석자: ${attendeesList}\\n` +
      `팀: ${team?.name}\\n` +
      `겹침률: ${Math.round(suggestion.overlap_ratio * 100)}%\\n` +
      `공정성 점수: ${Math.round(suggestion.fairness_score * 100)}%\\n\\n` +
      `Generated by FairMeet`;

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FairMeet//Meeting Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      foldLine(`UID:${uid}`),
      foldLine(`DTSTART:${formatDateUTC(startDate)}`),
      foldLine(`DTEND:${formatDateUTC(endDate)}`),
      foldLine(`DTSTAMP:${timestamp}`),
      foldLine(`SUMMARY:FairMeet — Team Meeting`),
      foldLine(`DESCRIPTION:${description}`),
      foldLine(`ORGANIZER:CN=FairMeet:MAILTO:noreply@fairmeet.com`),
      'STATUS:TENTATIVE',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const icsContent = icsLines.join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fairmeet-${formatDateUTC(startDate)}.ics`;
    link.click();

    toast({
      title: "ICS 파일 다운로드",
      description: "캘린더 파일이 다운로드되었습니다.",
    });
  };

  const handleGoogleCalendar = (suggestion: Suggestion) => {
    const startDate = new Date(suggestion.starts_at_utc);
    const endDate = new Date(suggestion.ends_at_utc);
    const attendingMembers = getMembersByIds(suggestion.attending_member_ids);
    
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent('FairMeet — Team Meeting');
    const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
    
    const details = encodeURIComponent(
      `공정한 회의 시간 추천\n\n` +
      `참석자: ${attendingMembers.map(m => m.display_name).join(', ')}\n` +
      `팀: ${team?.name}\n` +
      `겹침률: ${Math.round(suggestion.overlap_ratio * 100)}%\n` +
      `공정성 점수: ${Math.round(suggestion.fairness_score * 100)}%\n\n` +
      `Generated by FairMeet`
    );

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    
    window.open(googleUrl, '_blank');
  };

  const handleCopyInvite = async (suggestion: Suggestion) => {
    const attendingMembers = getMembersByIds(suggestion.attending_member_ids);
    const startTime = formatTimeForTeam(suggestion.starts_at_utc, team?.default_timezone || 'UTC');
    
    const inviteText = `🗓️ Team Meeting Invitation

📅 Time: ${startTime}
👥 Attendees: ${attendingMembers.map(m => m.display_name).join(', ')}
📊 Overlap: ${Math.round(suggestion.overlap_ratio * 100)}%
⚖️ Fairness: ${Math.round(suggestion.fairness_score * 100)}%

Generated by FairMeet`;

    try {
      await navigator.clipboard.writeText(inviteText);
      toast({
        title: "초대 텍스트 복사됨",
        description: "클립보드에 복사되었습니다.",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleExportTest = () => {
    const now = new Date();
    const testSlots = [
      {
        id: 'test-pst',
        name: 'PST Test Meeting',
        timezone: 'America/Los_Angeles',
        offset: 2 // 2 hours from now
      },
      {
        id: 'test-utc',
        name: 'UTC Test Meeting', 
        timezone: 'UTC',
        offset: 4 // 4 hours from now
      },
      {
        id: 'test-kst',
        name: 'KST Test Meeting',
        timezone: 'Asia/Seoul',
        offset: 6 // 6 hours from now
      }
    ];

    testSlots.forEach(slot => {
      const startTime = new Date(now.getTime() + slot.offset * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 45 * 60 * 1000); // 45 minutes

      const formatDateUTC = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const foldLine = (line: string) => {
        if (line.length <= 75) return line;
        
        let folded = '';
        let remaining = line;
        
        while (remaining.length > 75) {
          folded += remaining.substring(0, 75) + '\r\n ';
          remaining = remaining.substring(75);
        }
        folded += remaining;
        
        return folded;
      };

      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const uid = `test-${slot.id}-${timestamp}@fairmeet.com`;
      
      const description = `Calendar Export Test - ${slot.name}\\n\\n` +
        `Timezone: ${slot.timezone}\\n` +
        `Local Start: ${formatInTimeZone(startTime, slot.timezone, 'MMM d, yyyy HH:mm zzz')}\\n` +
        `UTC Start: ${startTime.toISOString()}\\n\\n` +
        `Test: Verify this meeting appears at the correct local time in your calendar app.\\n\\n` +
        `Generated by FairMeet QA`;

      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FairMeet//QA Test//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        foldLine(`UID:${uid}`),
        foldLine(`DTSTART:${formatDateUTC(startTime)}`),
        foldLine(`DTEND:${formatDateUTC(endTime)}`),
        foldLine(`DTSTAMP:${timestamp}`),
        foldLine(`SUMMARY:FairMeet QA - ${slot.name}`),
        foldLine(`DESCRIPTION:${description}`),
        foldLine(`ORGANIZER:CN=FairMeet QA:MAILTO:qa@fairmeet.com`),
        'STATUS:TENTATIVE',
        'TRANSP:OPAQUE',
        'END:VEVENT',
        'END:VCALENDAR'
      ];

      const icsContent = icsLines.join('\r\n');
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fairmeet-qa-${slot.id}-${formatDateUTC(startTime)}.ics`;
      link.click();
    });

    toast({
      title: "QA 테스트 파일 생성",
      description: "PST, UTC, KST 테스트 ICS 파일 3개가 다운로드되었습니다.",
    });
  };

  const handleMemberFormSuccess = () => {
    fetchTeamData();
    setMemberFormOpen(false);
    setEditingMember(null);
  };

  const handleEditMember = async (memberId: string) => {
    try {
      // Fetch member details with working blocks and no meeting blocks
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      const { data: workingBlocks, error: workingError } = await supabase
        .from('working_blocks')
        .select('*')
        .eq('member_id', memberId);

      if (workingError) throw workingError;

      const { data: noMeetingBlocks, error: noMeetingError } = await supabase
        .from('no_meeting_blocks')
        .select('*')
        .eq('member_id', memberId);

      if (noMeetingError) throw noMeetingError;

      setEditingMember({
        ...memberData,
        working_blocks: workingBlocks,
        no_meeting_blocks: noMeetingBlocks
      });
      setMemberFormOpen(true);
    } catch (error: any) {
      toast({
        title: "멤버 정보 로드 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('정말로 이 멤버를 삭제하시겠습니까?')) return;

    try {
      // Delete related blocks first
      await supabase.from('working_blocks').delete().eq('member_id', memberId);
      await supabase.from('no_meeting_blocks').delete().eq('member_id', memberId);
      
      // Delete member
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "멤버 삭제 완료",
        description: "멤버가 성공적으로 삭제되었습니다.",
      });

      fetchTeamData();
    } catch (error: any) {
      toast({
        title: "멤버 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createSampleTeam = async () => {
    if (!team) return;

    try {
      const sampleMembers = [
        { name: 'Alice (PT)', timezone: 'America/Los_Angeles', email: 'alice@example.com' },
        { name: 'Bob (UTC)', timezone: 'UTC', email: 'bob@example.com' },
        { name: 'Charlie (IST)', timezone: 'Asia/Kolkata', email: 'charlie@example.com' },
        { name: 'Diana (KST)', timezone: 'Asia/Seoul', email: 'diana@example.com' }
      ];

      for (const member of sampleMembers) {
        const { error } = await supabase
          .from('team_members')
          .insert({
            team_id: team.id,
            display_name: member.name,
            email: member.email,
            role: 'member',
            timezone: member.timezone
          });

        if (error) throw error;
      }

      // Create sample rules
      const { error: rulesError } = await supabase
        .from('rules')
        .upsert({
          team_id: team.id,
          cadence: 'weekly',
          duration_minutes: 60,
          min_attendance_ratio: 0.6,
          night_cap_per_week: 1,
          prohibited_days: [0, 6], // Sunday and Saturday
          rotation_enabled: true
        });

      if (rulesError) throw rulesError;

      toast({
        title: "샘플 팀 생성 완료",
        description: "4명의 샘플 멤버와 기본 규칙이 추가되었습니다.",
      });

      fetchTeamData();
    } catch (error: any) {
      toast({
        title: "샘플 팀 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">팀을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/app')}>
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const canManage = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{team.name}</h1>
                <p className="text-sm text-muted-foreground">/{team.slug}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={userRole === 'owner' ? 'default' : 'secondary'}>
                {userRole === 'owner' ? '소유자' : 
                 userRole === 'admin' ? '관리자' : '멤버'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">멤버</TabsTrigger>
            <TabsTrigger value="rules">규칙</TabsTrigger>
            <TabsTrigger value="suggestions">추천</TabsTrigger>
            <TabsTrigger value="share">공유</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>팀 멤버 ({members.length}명)</span>
                  </CardTitle>
                  {canManage && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={createSampleTeam}>
                        <Plus className="h-4 w-4 mr-2" />
                        샘플 팀 생성
                      </Button>
                      <Button size="sm" className="btn-gradient" onClick={() => setMemberFormOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        멤버 추가
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">팀 멤버가 없습니다</h3>
                    <p className="text-muted-foreground mb-4">
                      팀 멤버를 추가하여 회의 스케줄링을 시작하세요.
                    </p>
                    {canManage && (
                      <Button className="btn-gradient" onClick={createSampleTeam}>
                        샘플 팀 생성하기
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{member.display_name}</h4>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-xs text-muted-foreground">{member.timezone}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                            {member.role === 'owner' ? '소유자' : 
                             member.role === 'admin' ? '관리자' : '멤버'}
                          </Badge>
                          {canManage && (
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditMember(member.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteMember(member.id)}
                                disabled={member.role === 'owner'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            {canManage ? (
              <RulesForm 
                teamId={team.id} 
                members={members}
                onSuccess={fetchTeamData}
              />
            ) : (
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>회의 규칙</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">규칙 보기</h3>
                    <p className="text-muted-foreground mb-4">
                      팀 관리자만 규칙을 수정할 수 있습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>회의 시간 추천</span>
                  </CardTitle>
                   {canManage && (
                     <div className="flex space-x-2">
                       <Button 
                         className="btn-gradient" 
                         onClick={generateSuggestions}
                         disabled={generatingsuggestions}
                       >
                         {generatingsuggestions ? "생성 중..." : "추천 만들기"}
                       </Button>
                       {suggestions.length > 0 && (
                         <Button 
                           variant="outline"
                           onClick={createShareLink}
                           disabled={creatingShareLink}
                         >
                           <Share className="h-4 w-4 mr-2" />
                           {creatingShareLink ? "생성 중..." : "공유 링크"}
                         </Button>
                       )}
                       <Button 
                         variant="outline"
                         onClick={handleExportTest}
                         className="text-xs"
                       >
                         Export test
                       </Button>
                     </div>
                   )}
                </div>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">추천 시간이 없습니다</h3>
                    <p className="text-muted-foreground mb-4">
                      {members.length < 2 
                        ? "팀원을 추가하고 규칙을 설정한 후 회의 시간을 추천받으세요."
                        : rules?.min_attendance_ratio > 0.8
                        ? "겹치는 시간이 기준에 못 미칩니다. 최소 참석 비율을 낮춰보세요."
                        : "팀원과 규칙을 설정한 후 회의 시간을 추천받으세요."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Filters and Sort */}
                    <div className="flex items-center justify-between gap-4 p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Filter className="h-4 w-4" />
                          <span className="text-sm font-medium">정렬:</span>
                          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="score">점수순</SelectItem>
                              <SelectItem value="time">시간순</SelectItem>
                              <SelectItem value="fairness">공정성순</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {rules?.required_member_ids?.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="required-only" 
                              checked={showRequiredOnly}
                              onCheckedChange={setShowRequiredOnly}
                            />
                            <Label htmlFor="required-only" className="text-sm">
                              필수 참석자만
                            </Label>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {getSortedAndFilteredSuggestions().length}개 추천
                      </div>
                    </div>

                    {/* Suggestions */}
                    {getSortedAndFilteredSuggestions().map((suggestion, index) => {
                      const attendingMembers = getMembersByIds(suggestion.attending_member_ids);
                      const score = calculateScore(suggestion);
                      const hasRequiredMembers = rules?.required_member_ids?.length > 0 && 
                        rules.required_member_ids.every((reqId: string) => 
                          suggestion.attending_member_ids.includes(reqId)
                        );

                      return (
                        <Card key={suggestion.id} className="card-elegant">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg mb-2">
                                  추천 #{index + 1}
                                  {hasRequiredMembers && (
                                    <Badge className="ml-2 bg-green-100 text-green-800">
                                      Required
                                    </Badge>
                                  )}
                                </CardTitle>
                                <div className="text-sm text-muted-foreground">
                                  <p className="font-medium">
                                    📅 {formatTimeForTeam(suggestion.starts_at_utc, team?.default_timezone || 'UTC')}
                                  </p>
                                  <p>
                                    ⏱️ {Math.round((new Date(suggestion.ends_at_utc).getTime() - new Date(suggestion.starts_at_utc).getTime()) / (1000 * 60))}분
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-y-2">
                                <div className="flex space-x-2">
                                  <Badge variant="secondary">
                                    겹침 {Math.round(suggestion.overlap_ratio * 100)}%
                                  </Badge>
                                  <Badge variant="outline">
                                    공정성 {Math.round(suggestion.fairness_score * 100)}%
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  점수: {score.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-4">
                              {/* Attendees */}
                              <div>
                                <h4 className="text-sm font-medium mb-2">👥 참석자 ({attendingMembers.length}명)</h4>
                                <div className="flex flex-wrap gap-2">
                                  {attendingMembers.slice(0, 3).map(member => (
                                    <Badge key={member.id} variant="outline" className="text-xs">
                                      {member.display_name}
                                      <span className="ml-1 text-muted-foreground">
                                        ({formatTimeForTeam(suggestion.starts_at_utc, member.timezone)})
                                      </span>
                                    </Badge>
                                  ))}
                                  {attendingMembers.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{attendingMembers.length - 3}명
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2 pt-2 border-t">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleExportICS(suggestion)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  ICS
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleGoogleCalendar(suggestion)}
                                >
                                  <CalendarDays className="h-4 w-4 mr-1" />
                                  Google
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => console.log('Share:', suggestion.id)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Share
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCopyInvite(suggestion)}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share className="h-5 w-5" />
                  <span>공유 링크</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Share className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">공유 링크 관리</h3>
                  <p className="text-muted-foreground mb-4">
                    팀 외부 사람들과 회의 제안을 공유하세요.
                  </p>
                  {canManage && (
                    <Button className="btn-gradient">
                      공유 링크 생성
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Member Form Modal */}
      <MemberForm
        open={memberFormOpen}
        onOpenChange={setMemberFormOpen}
        teamId={team.id}
        member={editingMember}
        onSuccess={handleMemberFormSuccess}
      />
    </div>
  );
};

export default TeamDetail;