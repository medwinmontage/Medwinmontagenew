import 'server-only';
import { cache } from 'react';
import type { Metadata } from 'next';
import { prisma } from './prisma';
import { BRAND_NAME, BRAND_TAGLINE } from './brand';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

const DEFAULTS = {
  siteTitle: 'Medwin Montage',
  seoTitle: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
  titleTemplate: '%s | Medwin Montage',
  metaDescription: 'Freelancing creative & digital services: video editing, videography, design, AI content, websites and digital marketing for businesses, creators and brands.',
  primaryKeywords: [] as string[], secondaryKeywords: [] as string[],
  businessName: 'Medwin Montage', businessDescription: '', canonicalUrl: '',
  ogTitle: '', ogDescription: '', ogImage: '', twitterTitle: '', twitterDescription: '', twitterImage: '',
  primaryLocation: '', city: '', district: '', state: '', country: 'India',
  serviceAreas: [] as string[], nearbyLocations: [] as string[], mainServices: [] as string[], serviceKeywords: [] as string[],
  localDescription: '', robotsIndex: true, robotsFollow: true, sitemapEnabled: true, structuredData: true,
};
export type Seo = typeof DEFAULTS;

/** SEO settings from Admin → SEO Settings, once per request. Falls back to defaults if the database is unreachable (e.g. at build time). */
export const getSeo = cache(async (): Promise<Seo> => {
  // While `next build` pre-renders the few static pages (404, admin login) there is nothing worth reading from the database,
  // and a build machine often cannot reach it — skip the query so the build log stays clean and never depends on the DB.
  if (process.env.NEXT_PHASE === 'phase-production-build') return DEFAULTS;
  try {
    const row = await prisma.seoSettings.findUnique({ where: { id: 'singleton' } });
    if (!row) return DEFAULTS;
    const merged: Record<string, unknown> = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS) as (keyof Seo)[]) {
      const v = (row as Record<string, unknown>)[key];
      if (typeof v === 'string' ? v.trim() !== '' : v !== null && v !== undefined) merged[key] = v;
    }
    return merged as Seo;
  } catch {
    return DEFAULTS;
  }
});

export function siteBase(seo: Seo): string {
  return (seo.canonicalUrl || SITE_URL).replace(/\/$/, '');
}
const abs = (base: string, url: string) => (url.startsWith('http') ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`);

/** "Thanjavur, Tamil Nadu" — only the parts the admin filled in. */
export function locationLabel(seo: Seo): string {
  return [seo.city || seo.primaryLocation, seo.state].filter(Boolean).join(', ');
}

/** Site-wide defaults (root layout). Pages override title/description/canonical with pageMetadata(). */
export function baseMetadata(seo: Seo): Metadata {
  const base = siteBase(seo);
  const title = seo.seoTitle || seo.siteTitle;
  const ogImage = seo.ogImage ? [abs(base, seo.ogImage)] : undefined;
  const keywords = Array.from(new Set([...seo.primaryKeywords, ...seo.secondaryKeywords, ...seo.serviceKeywords]));
  return {
    metadataBase: new URL(base),
    title: { default: title, template: seo.titleTemplate || '%s' },
    description: seo.metaDescription,
    keywords: keywords.length ? keywords : undefined,
    applicationName: seo.siteTitle,
    robots: { index: seo.robotsIndex, follow: seo.robotsFollow },
    openGraph: {
      type: 'website', siteName: seo.siteTitle, locale: 'en_IN',
      title: seo.ogTitle || title, description: seo.ogDescription || seo.metaDescription, images: ogImage,
    },
    twitter: {
      card: ogImage || seo.twitterImage ? 'summary_large_image' : 'summary',
      title: seo.twitterTitle || seo.ogTitle || title,
      description: seo.twitterDescription || seo.ogDescription || seo.metaDescription,
      images: seo.twitterImage ? [abs(base, seo.twitterImage)] : ogImage,
    },
  };
}

/** Per-page title, description and canonical URL, so no two pages share them. */
export function pageMetadata(seo: Seo, page: { path: string; title?: string; description?: string; index?: boolean }): Metadata {
  const base = siteBase(seo);
  const url = `${base}${page.path === '/' ? '' : page.path}` || base;
  const description = page.description || seo.metaDescription;
  return {
    ...(page.title ? { title: page.title } : {}),
    description,
    alternates: { canonical: url },
    ...(page.index === false ? { robots: { index: false, follow: false } } : {}),
    openGraph: { url, ...(page.title ? { title: page.title } : {}), description },
  };
}

type Jsonish = Record<string, unknown>;
const clean = (o: Jsonish): Jsonish => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)));

/** schema.org JSON-LD for the home page: business, website, services and FAQ. */
export function homeJsonLd(seo: Seo, data: {
  phone?: string; email?: string; address?: string; sameAs: string[]; logo?: string;
  services: { title: string; desc: string }[]; faqs: { question: string; answer: string }[];
}): Jsonish[] {
  if (!seo.structuredData) return [];
  const base = siteBase(seo);
  const areas = Array.from(new Set([seo.city, ...seo.serviceAreas, ...seo.nearbyLocations].filter(Boolean)));
  const business = clean({
    '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': `${base}/#business`,
    name: seo.businessName, url: base,
    description: seo.localDescription || seo.businessDescription || seo.metaDescription,
    image: seo.ogImage ? abs(base, seo.ogImage) : undefined,
    logo: data.logo ? abs(base, data.logo) : undefined,
    telephone: data.phone, email: data.email,
    address: clean({ '@type': 'PostalAddress', streetAddress: data.address, addressLocality: seo.city, addressRegion: seo.state, addressCountry: seo.country }),
    areaServed: areas.map((name) => ({ '@type': 'City', name })),
    sameAs: data.sameAs,
    hasOfferCatalog: data.services.length ? {
      '@type': 'OfferCatalog', name: 'Services',
      itemListElement: data.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.desc, provider: { '@id': `${base}/#business` }, areaServed: areas.length ? areas : undefined } })),
    } : undefined,
  });
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${base}/#website`, url: base, name: seo.siteTitle, publisher: { '@id': `${base}/#business` } };
  const out: Jsonish[] = [business, website];
  if (data.faqs.length) {
    out.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: data.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) });
  }
  return out;
}

export function breadcrumbJsonLd(seo: Seo, trail: { name: string; path: string }[]): Jsonish {
  const base = siteBase(seo);
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: `${base}${t.path === '/' ? '' : t.path}` })) };
}
