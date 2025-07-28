import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Code, Image } from 'lucide-react';

const PreviewCard = () => {
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

        </div>
      </div>
    </div>
  );
};

export default PreviewCard;