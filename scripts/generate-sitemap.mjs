#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const baseUrl = 'https://fair-time-sync.lovable.app';
const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

// Define routes with their alternate languages
const routes = [
  {
    path: '/',
    alternates: [
      { hreflang: 'en', href: '/' },
      { hreflang: 'ko', href: '/ko' },
      { hreflang: 'x-default', href: '/' }
    ]
  },
  {
    path: '/demo',
    alternates: [
      { hreflang: 'en', href: '/demo' },
      { hreflang: 'ko', href: '/ko/demo' },
      { hreflang: 'x-default', href: '/demo' }
    ]
  },
  {
    path: '/ko',
    alternates: [
      { hreflang: 'en', href: '/' },
      { hreflang: 'ko', href: '/ko' },
      { hreflang: 'x-default', href: '/' }
    ]
  },
  {
    path: '/ko/demo',
    alternates: [
      { hreflang: 'en', href: '/demo' },
      { hreflang: 'ko', href: '/ko/demo' },
      { hreflang: 'x-default', href: '/demo' }
    ]
  },
  {
    path: '/health',
    alternates: []
  },
  {
    path: '/auth',
    alternates: []
  }
];

function generateSitemap() {
  const urls = routes.map(route => {
    const alternateLinks = route.alternates.map(alt => 
      `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${baseUrl}${alt.href}"/>`
    ).join('\n');

    return `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route.path === '/' ? '1.0' : '0.8'}</priority>${alternateLinks ? '\n' + alternateLinks : ''}
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

  const sitemapPath = join(publicDir, 'sitemap.xml');
  writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log(`✅ Sitemap generated: ${sitemapPath}`);
  console.log(`📅 Last modified: ${lastmod}`);
}

// Generate sitemap
try {
  generateSitemap();
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}