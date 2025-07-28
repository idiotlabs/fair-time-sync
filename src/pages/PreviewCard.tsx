import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Code, Image, TestTube, Download } from 'lucide-react';
import { generateTestCases, downloadICS, CalendarEvent, formatTimeInTimezone } from '@/lib/calendar-utils';
import { useState } from 'react';

const PreviewCard = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const runICSTests = () => {
    const testCases = generateTestCases();
    const results: string[] = [];

    testCases.forEach((testCase, index) => {
      try {
        const event: CalendarEvent = {
          id: `test-${index}`,
          teamId: 'test-team',
          title: `Test Event: ${testCase.name}`,
          description: testCase.description,
          startTime: testCase.startTime,
          endTime: testCase.endTime,
          attendees: [
            { name: 'Test User 1', email: 'test1@example.com' },
            { name: 'Test User 2', email: 'test2@example.com' }
          ],
          location: 'Virtual Test Meeting'
        };

        // Generate ICS and download
        downloadICS(event, `test-${index}-${testCase.name.replace(/\s+/g, '-').toLowerCase()}.ics`);
        
        const startLocal = formatTimeInTimezone(testCase.startTime, testCase.timezone);
        const endLocal = formatTimeInTimezone(testCase.endTime, testCase.timezone);
        
        results.push(
          `✅ ${testCase.name}: ${startLocal} → ${endLocal}`
        );
      } catch (error) {
        results.push(
          `❌ ${testCase.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    setTestResults(results);
  };
  const getMetaTags = () => {
    const metaTags = [
      { property: 'og:title', content: 'FairMeet — Fair Meeting Scheduler for Distributed Teams' },
      { property: 'og:description', content: 'Meet fairly across time zones. Rotate obligations, protect focus, and export to calendar.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://fair-time-sync.lovable.app/' },
      { property: 'og:image', content: 'https://fair-time-sync.lovable.app/og-cover.png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Meet fairly across time zones - FairMeet' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'FairMeet — Fair Meeting Scheduler for Distributed Teams' },
      { name: 'twitter:description', content: 'Meet fairly across time zones. Rotate obligations, protect focus, and export to calendar.' },
      { name: 'twitter:image', content: 'https://fair-time-sync.lovable.app/og-cover.png' },
      { name: 'twitter:image:alt', content: 'Meet fairly across time zones - FairMeet' }
    ];
    return metaTags;
  };

  const getStructuredData = () => {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "FairMeet",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "9",
        "priceCurrency": "USD"
      },
      "url": "https://fair-time-sync.lovable.app/",
      "description": "Meet fairly across time zones. Rotate obligations, protect focus, and export to calendar.",
      "creator": {
        "@type": "Organization",
        "name": "FairMeet"
      },
      "softwareVersion": "1.0",
      "applicationSubCategory": "Meeting Scheduler",
      "featureList": [
        "Smart time recommendations",
        "Fairness scoring",
        "Rotation system",
        "Multi-timezone support",
        "Calendar integration",
        "Team sharing"
      ]
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-8 w-8 text-primary" aria-hidden="true" />
            <span className="text-2xl font-bold text-gradient">FairMeet</span>
            <Badge variant="secondary" className="ml-4">
              Preview Debug
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">소셜 미리보기 & 메타 태그 디버그</h1>
            <p className="text-muted-foreground">
              FairMeet의 SEO 및 소셜 미디어 최적화 상태를 확인합니다
            </p>
          </div>

          {/* Meta Tags Section */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Open Graph & Twitter 메타 태그
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                {getMetaTags().map((tag, index) => (
                  <div key={index} className="p-2 bg-muted rounded border-l-4 border-primary">
                    <span className="text-blue-600">&lt;meta </span>
                    {tag.property && (
                      <>
                        <span className="text-green-600">property</span>=
                        <span className="text-yellow-600">"{tag.property}"</span>
                      </>
                    )}
                    {tag.name && (
                      <>
                        <span className="text-green-600">name</span>=
                        <span className="text-yellow-600">"{tag.name}"</span>
                      </>
                    )}
                    {' '}
                    <span className="text-green-600">content</span>=
                    <span className="text-yellow-600">"{tag.content}"</span>
                    <span className="text-blue-600"> /&gt;</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Structured Data Section */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                JSON-LD 구조화된 데이터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(getStructuredData(), null, 2)}</pre>
              </div>
            </CardContent>
          </Card>

          {/* OG Images Section */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Open Graph 이미지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">메인 OG 이미지</h4>
                  <div className="border rounded overflow-hidden">
                    <img 
                      src="/og-cover.png" 
                      alt="Main OG Cover" 
                      className="w-full h-auto"
                      style={{ aspectRatio: '1200/630' }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    URL: /og-cover.png (1200×630)
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">데모 OG 이미지</h4>
                  <div className="border rounded overflow-hidden">
                    <img 
                      src="/og-demo.png" 
                      alt="Demo OG Cover" 
                      className="w-full h-auto"
                      style={{ aspectRatio: '1200/630' }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    URL: /og-demo.png (1200×630)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Tools */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>소셜 미디어 미리보기 테스트 도구</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Facebook 디버거</h4>
                  <a 
                    href="https://developers.facebook.com/tools/debug/?q=https://fair-time-sync.lovable.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Facebook Sharing Debugger →
                  </a>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Twitter 카드 검증</h4>
                  <a 
                    href="https://cards-dev.twitter.com/validator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Twitter Card Validator →
                  </a>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">LinkedIn 검사기</h4>
                  <a 
                    href="https://www.linkedin.com/post-inspector/inspect/https://fair-time-sync.lovable.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    LinkedIn Post Inspector →
                  </a>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">구글 리치 결과 테스트</h4>
                  <a 
                    href="https://search.google.com/test/rich-results?url=https://fair-time-sync.lovable.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Rich Results Test →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Export Testing */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                캘린더 내보내기 테스트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    다양한 타임존 시나리오를 테스트하고 ICS 파일을 생성합니다.
                  </p>
                  <Button onClick={runICSTests} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Run ICS Test
                  </Button>
                </div>
                
                {testResults.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded">
                    <h4 className="font-semibold mb-2">Test Results:</h4>
                    <div className="space-y-1 text-sm font-mono">
                      {testResults.map((result, index) => (
                        <div key={index} className={result.startsWith('✅') ? 'text-green-600' : 'text-red-600'}>
                          {result}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ICS 파일들이 다운로드 폴더에 저장되었습니다. 각 파일을 캘린더 앱에서 열어 시간이 정확한지 확인하세요.
                    </p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">테스트 케이스:</h4>
                  <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                    <li>• KST Standard Time - 한국 저녁 시간 회의</li>
                    <li>• PST/PDT Transition - 서머타임 전환 기간</li>
                    <li>• UTC Meeting - 표준 UTC 시간</li>
                    <li>• Cross-Date Boundary - 날짜 경계 넘나드는 회의</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default PreviewCard;