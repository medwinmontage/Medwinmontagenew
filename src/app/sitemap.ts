import type { MetadataRoute } from 'next';
import { getSeo, siteBase } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const SERVICE_SLUGS = [
  'digital-marketing',
  'website-development',
  'ai-video-creation',
  'video-editing',
  'graphic-logo-design',
  'videography-and-event-shoots',
  'vehicle-delivery-shoots',
  'content-and-script-writing',
  'political-and-public-events',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeo();
  if (!seo.sitemapEnabled || !seo.robotsIndex) return [];
  const base = siteBase(seo);
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    ...SERVICE_SLUGS.map((slug) => ({ url: `${base}/services/${slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${base}/join-as-crew`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
