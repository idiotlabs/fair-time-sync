import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Settings, Share, Calendar, Plus } from 'lucide-react';

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

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTeamData();
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
                      <Button size="sm" className="btn-gradient">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
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
                  <h3 className="text-lg font-semibold mb-2">규칙 설정</h3>
                  <p className="text-muted-foreground mb-4">
                    회의 시간 추천을 위한 규칙을 설정하세요.
                  </p>
                  {canManage && (
                    <Button className="btn-gradient">
                      규칙 설정하기
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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
                    <Button className="btn-gradient">
                      추천 만들기
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">추천 시간이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    팀원과 규칙을 설정한 후 회의 시간을 추천받으세요.
                  </p>
                </div>
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
    </div>
  );
};

export default TeamDetail;