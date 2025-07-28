import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Clock, Users, Zap, Shield, Star } from 'lucide-react';

const Landing = () => {
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
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Link to="/auth">
              <Button variant="outline">로그인</Button>
            </Link>
            <Link to="/auth">
              <Button className="btn-gradient">시작하기</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          공정한 회의 스케줄링의 새로운 기준
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          전 세계 시간대를
          <span className="text-gradient block">공정하게 잇습니다</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          분산된 팀을 위한 공정한 회의 시간 추천 시스템. 
          시간대 부담을 균등하게 분배하고 최적의 겹치는 시간을 찾아드립니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="btn-gradient text-lg px-8">
              무료로 시작하기
            </Button>
          </Link>
          <Link to="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8">
              데모 보기
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">주요 기능</h2>
          <p className="text-xl text-muted-foreground">
            공정한 회의 스케줄링을 위한 모든 기능을 제공합니다
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="card-elegant">
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>스마트 시간 추천</CardTitle>
              <CardDescription>
                AI 기반 알고리즘으로 팀원들의 시간대와 근무 시간을 분석하여 최적의 회의 시간을 제안합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>공정성 점수</CardTitle>
              <CardDescription>
                각 팀원의 시간대 부담을 정량화하여 공정성 점수를 제공하고, 부담을 균등하게 분배합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>순환 시스템</CardTitle>
              <CardDescription>
                불편한 시간대의 회의 부담을 팀원들 간에 순환하여 장기적으로 공정한 분배를 보장합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Globe className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>다국적 팀 지원</CardTitle>
              <CardDescription>
                전 세계 모든 시간대를 지원하며, 각 팀원의 현지 시간으로 회의 정보를 표시합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>캘린더 통합</CardTitle>
              <CardDescription>
                Google Calendar, Outlook 등 주요 캘린더 서비스와 연동하여 원클릭으로 일정을 추가할 수 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <Star className="h-10 w-10 text-primary mb-2" aria-hidden="true" />
              <CardTitle>팀 공유</CardTitle>
              <CardDescription>
                회의 제안을 팀원들과 쉽게 공유하고, 읽기 전용 링크로 의사결정 과정을 투명하게 관리합니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">요금제</h2>
          <p className="text-xl text-muted-foreground">
            팀 규모에 맞는 요금제를 선택하세요
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>무료</CardTitle>
              <CardDescription>개인 및 소규모 팀</CardDescription>
              <div className="text-3xl font-bold">₩0<span className="text-sm font-normal">/월</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 팀 1개</li>
                <li>• 팀원 최대 5명</li>
                <li>• 주 2회 추천 생성</li>
                <li>• 기본 공유 기능</li>
              </ul>
              <Button className="w-full mt-6" variant="outline">시작하기</Button>
            </CardContent>
          </Card>

          <Card className="card-elegant border-primary">
            <CardHeader>
              <Badge className="mb-2">인기</Badge>
              <CardTitle>프로</CardTitle>
              <CardDescription>성장하는 팀</CardDescription>
              <div className="text-3xl font-bold">₩29,000<span className="text-sm font-normal">/월</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 무제한 팀</li>
                <li>• 팀당 최대 20명</li>
                <li>• 무제한 추천 생성</li>
                <li>• 커스텀 브랜딩</li>
                <li>• 고급 분석</li>
              </ul>
              <Button className="w-full mt-6 btn-gradient">시작하기</Button>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>팀</CardTitle>
              <CardDescription>대규모 조직</CardDescription>
              <div className="text-3xl font-bold">₩99,000<span className="text-sm font-normal">/월</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 무제한 팀</li>
                <li>• 팀당 최대 50명</li>
                <li>• Slack 연동</li>
                <li>• 감사 로그</li>
                <li>• 전담 지원</li>
              </ul>
              <Button className="w-full mt-6" variant="outline">문의하기</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">자주 묻는 질문</h2>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">FairMeet은 어떻게 공정성을 보장하나요?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                각 팀원의 현지 시간을 기준으로 불편한 시간대(오전 7시 이전, 오후 9시 이후)의 회의 빈도를 추적하고, 
                이를 균등하게 분배하여 장기적으로 모든 팀원이 공평한 부담을 갖도록 합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">어떤 캘린더 서비스를 지원하나요?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Google Calendar, Microsoft Outlook, Apple Calendar 등 주요 캘린더 서비스와 연동됩니다. 
                ICS 파일 다운로드도 지원하여 모든 캘린더 앱에서 사용할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">무료 플랜의 제한사항은 무엇인가요?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                무료 플랜에서는 1개 팀, 최대 5명의 팀원, 주 2회 추천 생성이 가능합니다. 
                더 많은 기능이 필요하시면 프로 플랜으로 업그레이드하세요.
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
              <a href="#" className="hover:text-foreground transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-foreground transition-colors">이용약관</a>
              <a href="#" className="hover:text-foreground transition-colors">고객지원</a>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-4">
            © 2024 FairMeet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;