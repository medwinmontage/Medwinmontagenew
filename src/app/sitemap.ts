import type { MetadataRoute } from 'next';
import { getSeo, siteBase } from '@/lib/seo';

export const dynamic = 'force-dynamic';

// Only real pages are listed. The customer portal and admin are private and left out.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeo();
  if (!seo.sitemapEnabled || !seo.robotsIndex) return [];
  const base = siteBase(seo);
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/join-as-crew`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
