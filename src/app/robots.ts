import type { MetadataRoute } from 'next';
import { getSeo, siteBase } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeo();
  const base = siteBase(seo);
  if (!seo.robotsIndex) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/account'] }],
    ...(seo.sitemapEnabled ? { sitemap: `${base}/sitemap.xml` } : {}),
    host: base,
  };
}
