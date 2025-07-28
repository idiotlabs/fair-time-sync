import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  details: string;
}

const E2ETest: React.FC = () => {
  const { locale } = useI18n();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Check H1 content
    try {
      const h1 = document.querySelector('h1');
      const h1Text = h1?.textContent || '';
      const expectedEn = 'Meet fairly across time zones.';
      const expectedKo = '전 세계 시간대를 공정하게 잇습니다.';
      
      if (locale === 'en' && h1Text.includes('Meet fairly')) {
        results.push({ name: 'H1 Content (EN)', status: 'pass', details: h1Text });
      } else if (locale === 'ko' && h1Text.includes('전 세계')) {
        results.push({ name: 'H1 Content (KO)', status: 'pass', details: h1Text });
      } else {
        results.push({ name: 'H1 Content', status: 'fail', details: `Expected locale ${locale} text, got: ${h1Text}` });
      }
    } catch (error) {
      results.push({ name: 'H1 Content', status: 'fail', details: `Error: ${error}` });
    }

    // Test 2: Check CTA buttons
    try {
      const ctaButtons = document.querySelectorAll('button, a[href*="demo"]');
      let foundValidCTA = false;
      
      ctaButtons.forEach(button => {
        const text = button.textContent || '';
        if (locale === 'en' && (text.includes('Try the live demo') || text.includes('Start free'))) {
          foundValidCTA = true;
        } else if (locale === 'ko' && (text.includes('라이브 데모') || text.includes('무료 시작'))) {
          foundValidCTA = true;
        }
      });

      if (foundValidCTA) {
        results.push({ name: 'CTA Button Text', status: 'pass', details: `Found appropriate CTA for ${locale}` });
      } else {
        results.push({ name: 'CTA Button Text', status: 'fail', details: `No appropriate CTA found for ${locale}` });
      }
    } catch (error) {
      results.push({ name: 'CTA Button Text', status: 'fail', details: `Error: ${error}` });
    }

    // Test 3: Check sitemap.xml
    try {
      const sitemapResponse = await fetch('/sitemap.xml');
      results.push({ 
        name: 'Sitemap.xml', 
        status: sitemapResponse.ok ? 'pass' : 'fail', 
        details: `Status: ${sitemapResponse.status}` 
      });
    } catch (error) {
      results.push({ name: 'Sitemap.xml', status: 'fail', details: `Error: ${error}` });
    }

    // Test 4: Check robots.txt
    try {
      const robotsResponse = await fetch('/robots.txt');
      results.push({ 
        name: 'Robots.txt', 
        status: robotsResponse.ok ? 'pass' : 'fail', 
        details: `Status: ${robotsResponse.status}` 
      });
    } catch (error) {
      results.push({ name: 'Robots.txt', status: 'fail', details: `Error: ${error}` });
    }

    // Test 5: Check locale routing
    try {
      const currentPath = window.location.pathname;
      const isKoRoute = currentPath.startsWith('/ko');
      const routeMatchesLocale = (locale === 'ko' && isKoRoute) || (locale === 'en' && !isKoRoute);
      
      results.push({ 
        name: 'Locale Routing', 
        status: routeMatchesLocale ? 'pass' : 'fail', 
        details: `Path: ${currentPath}, Locale: ${locale}` 
      });
    } catch (error) {
      results.push({ name: 'Locale Routing', status: 'fail', details: `Error: ${error}` });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on mount
    const timer = setTimeout(runTests, 1000);
    return () => clearTimeout(timer);
  }, [locale]);

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg border p-6">
          <h1 className="text-3xl font-bold mb-6">E2E Test Results</h1>
          
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded">
              <h3 className="font-semibold">Current Locale</h3>
              <p className="text-2xl font-bold text-primary">{locale.toUpperCase()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold text-green-800">Passed</h3>
              <p className="text-2xl font-bold text-green-600">{passCount}</p>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <h3 className="font-semibold text-red-800">Failed</h3>
              <p className="text-2xl font-bold text-red-600">{failCount}</p>
            </div>
          </div>

          <div className="mb-6">
            <button 
              onClick={runTests} 
              disabled={isRunning}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded border-l-4 ${
                  result.status === 'pass' 
                    ? 'bg-green-50 border-green-500' 
                    : result.status === 'fail'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{result.name}</h3>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    result.status === 'pass' 
                      ? 'bg-green-100 text-green-800'
                      : result.status === 'fail'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{result.details}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted rounded">
            <h3 className="font-semibold mb-2">Test Coverage</h3>
            <ul className="text-sm space-y-1">
              <li>• H1 text content for current locale</li>
              <li>• CTA button text localization</li>
              <li>• Sitemap.xml accessibility (200 OK)</li>
              <li>• Robots.txt accessibility (200 OK)</li>
              <li>• URL routing matches current locale</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default E2ETest;