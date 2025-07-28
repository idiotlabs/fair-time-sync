import React, { useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';

interface MetaTagInfo {
  name: string;
  content: string;
  property?: string;
  rel?: string;
  href?: string;
  hreflang?: string;
}

const DebugMeta: React.FC = () => {
  const { locale } = useI18n();
  const [metaTags, setMetaTags] = useState<MetaTagInfo[]>([]);
  const [documentInfo, setDocumentInfo] = useState({
    title: '',
    url: '',
    lang: ''
  });

  useEffect(() => {
    // Collect document info
    setDocumentInfo({
      title: document.title,
      url: window.location.href,
      lang: document.documentElement.lang
    });

    // Collect meta tags
    const tags: MetaTagInfo[] = [];
    
    // Title
    const title = document.querySelector('title');
    if (title) {
      tags.push({ name: 'title', content: title.textContent || '' });
    }

    // Meta description
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      tags.push({ 
        name: 'meta[name="description"]', 
        content: description.getAttribute('content') || '' 
      });
    }

    // Open Graph tags
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      tags.push({
        name: `meta[property="${meta.getAttribute('property')}"]`,
        content: meta.getAttribute('content') || '',
        property: meta.getAttribute('property') || ''
      });
    });

    // Twitter cards
    document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
      tags.push({
        name: `meta[name="${meta.getAttribute('name')}"]`,
        content: meta.getAttribute('content') || ''
      });
    });

    // Canonical link
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      tags.push({
        name: 'link[rel="canonical"]',
        content: canonical.getAttribute('href') || '',
        rel: 'canonical',
        href: canonical.getAttribute('href') || ''
      });
    }

    // Hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => {
      tags.push({
        name: `link[hreflang="${link.getAttribute('hreflang')}"]`,
        content: link.getAttribute('href') || '',
        rel: 'alternate',
        href: link.getAttribute('href') || '',
        hreflang: link.getAttribute('hreflang') || ''
      });
    });

    // Robots meta
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) {
      tags.push({
        name: 'meta[name="robots"]',
        content: robots.getAttribute('content') || ''
      });
    }

    setMetaTags(tags);
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-lg border p-6">
          <h1 className="text-3xl font-bold mb-6">Meta Tags Debug</h1>
          
          {/* Document Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Document Information</h2>
            <div className="bg-muted p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Current Locale:</strong> {locale}
                </div>
                <div>
                  <strong>Document Lang:</strong> {documentInfo.lang || 'Not set'}
                </div>
                <div>
                  <strong>Current URL:</strong> {documentInfo.url}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Tags Table */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Meta Tags & Links</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Tag</th>
                    <th className="border border-border p-3 text-left">Content/Href</th>
                    <th className="border border-border p-3 text-left">Additional Attributes</th>
                  </tr>
                </thead>
                <tbody>
                  {metaTags.map((tag, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="border border-border p-3 font-mono text-sm">
                        {tag.name}
                      </td>
                      <td className="border border-border p-3 text-sm break-all">
                        {tag.content || tag.href}
                      </td>
                      <td className="border border-border p-3 text-sm">
                        {tag.property && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1">property: {tag.property}</span>}
                        {tag.rel && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-1">rel: {tag.rel}</span>}
                        {tag.hreflang && <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">hreflang: {tag.hreflang}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Tests */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Validation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-muted/50 p-4 rounded">
                <h3 className="font-semibold mb-2">SEO Essentials</h3>
                <div className="space-y-1 text-sm">
                  <div className={documentInfo.title ? 'text-green-600' : 'text-red-600'}>
                    {documentInfo.title ? '✓' : '✗'} Title tag
                  </div>
                  <div className={metaTags.find(t => t.name === 'meta[name="description"]') ? 'text-green-600' : 'text-red-600'}>
                    {metaTags.find(t => t.name === 'meta[name="description"]') ? '✓' : '✗'} Meta description
                  </div>
                  <div className={metaTags.find(t => t.rel === 'canonical') ? 'text-green-600' : 'text-red-600'}>
                    {metaTags.find(t => t.rel === 'canonical') ? '✓' : '✗'} Canonical URL
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded">
                <h3 className="font-semibold mb-2">Open Graph</h3>
                <div className="space-y-1 text-sm">
                  <div className={metaTags.find(t => t.property === 'og:title') ? 'text-green-600' : 'text-red-600'}>
                    {metaTags.find(t => t.property === 'og:title') ? '✓' : '✗'} og:title
                  </div>
                  <div className={metaTags.find(t => t.property === 'og:description') ? 'text-green-600' : 'text-red-600'}>
                    {metaTags.find(t => t.property === 'og:description') ? '✓' : '✗'} og:description
                  </div>
                  <div className={metaTags.find(t => t.property === 'og:image') ? 'text-green-600' : 'text-red-600'}>
                    {metaTags.find(t => t.property === 'og:image') ? '✓' : '✗'} og:image
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded">
                <h3 className="font-semibold mb-2">Internationalization</h3>
                <div className="space-y-1 text-sm">
                  <div className={metaTags.filter(t => t.hreflang).length > 0 ? 'text-green-600' : 'text-red-600'}>
                    {metaTags.filter(t => t.hreflang).length > 0 ? '✓' : '✗'} Hreflang links ({metaTags.filter(t => t.hreflang).length})
                  </div>
                  <div className={metaTags.find(t => t.hreflang === 'x-default') ? 'text-green-600' : 'text-red-600'}>
                    {metaTags.find(t => t.hreflang === 'x-default') ? '✓' : '✗'} x-default hreflang
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugMeta;