/**
 * /robots.txt — generated so the sitemap URL is always correct for the current SITE_URL.
 *
 * Only a build with DEPLOY_ENV=production may be indexed. Every other build
 * (local, preview deploys, staging) blocks all crawlers, so test sites never appear in Google.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const isProduction = process.env.DEPLOY_ENV === 'production';
  const sitemapUrl = new URL('/sitemap-index.xml', site).href;

  const body = isProduction
    ? ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemapUrl}`, ''].join('\n')
    : ['# Non-production build: do not index.', 'User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
