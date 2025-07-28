import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Clock, Settings, LogOut, Globe } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  slug: string;
  locale: string;
  member_count?: number;
  user_role?: string;
}

const Dashboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamSlug, setTeamSlug] = useState('');
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTeams();
  }, [user, navigate]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          role,
          teams (
            id,
            name,
            slug,
            locale
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const teamsData = data?.map(item => ({
        ...item.teams,
        user_role: item.role
      })) || [];

      setTeams(teamsData as Team[]);
    } catch (error: any) {
      toast({
        title: "팀 목록 로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTeamNameChange = (value: string) => {
    setTeamName(value);
    setTeamSlug(generateSlug(value));
  };

  const createTeam = async () => {
    if (!teamName.trim() || !teamSlug.trim()) {
      toast({
        title: "입력 오류",
        description: "팀 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          slug: teamSlug,
          locale: 'ko'
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add current user as owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: user?.id,
          display_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
          email: user?.email,
          role: 'owner',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });

      if (memberError) throw memberError;

      // Create default billing subscription
      const { error: billingError } = await supabase
        .from('billing_subscriptions')
        .insert({
          team_id: teamData.id,
          plan: 'free'
        });

      if (billingError) throw billingError;

      toast({
        title: "팀 생성 성공",
        description: `${teamName} 팀이 생성되었습니다.`,
      });

      setCreateTeamOpen(false);
      setTeamName('');
      setTeamSlug('');
      fetchTeams();
    } catch (error: any) {
      toast({
        title: "팀 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">FairMeet</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Link to="/app/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">대시보드</h1>
          <p className="text-muted-foreground">
            팀을 관리하고 공정한 회의 시간을 찾아보세요.
          </p>
        </div>

        {/* Teams Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Team Card */}
          <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
            <DialogTrigger asChild>
              <Card className="card-elegant cursor-pointer hover:shadow-lg transition-all border-dashed border-2 border-primary/30 hover:border-primary/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">새 팀 만들기</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    새로운 팀을 생성하고 팀원들을 초대하세요
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 팀 만들기</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team-name">팀 이름</Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => handleTeamNameChange(e.target.value)}
                    placeholder="예: 마케팅 팀"
                  />
                </div>
                <div>
                  <Label htmlFor="team-slug">팀 URL</Label>
                  <Input
                    id="team-slug"
                    value={teamSlug}
                    onChange={(e) => setTeamSlug(e.target.value)}
                    placeholder="marketing-team"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    팀 페이지 주소: /app/teams/{teamSlug}
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateTeamOpen(false)}>
                    취소
                  </Button>
                  <Button className="btn-gradient" onClick={createTeam}>
                    팀 만들기
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Team Cards */}
          {teams.map((team) => (
            <Link key={team.id} to={`/app/teams/${team.slug}`}>
              <Card className="card-elegant cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge variant={team.user_role === 'owner' ? 'default' : 'secondary'}>
                      {team.user_role === 'owner' ? '소유자' : 
                       team.user_role === 'admin' ? '관리자' : '멤버'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{team.member_count || 0}명</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Globe className="h-4 w-4" />
                      <span>{team.locale === 'ko' ? '한국어' : 'English'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    /app/teams/{team.slug}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {teams.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 팀이 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              첫 번째 팀을 만들어 공정한 회의 스케줄링을 시작하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;