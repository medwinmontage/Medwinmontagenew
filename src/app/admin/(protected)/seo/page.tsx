import { prisma } from '@/lib/prisma';
import SeoForm from '@/components/admin/SeoForm';

export const dynamic = 'force-dynamic';

export default async function AdminSeoPage() {
  const row = await prisma.seoSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton' }, update: {} });
  const { id, updatedAt, ...seo } = row;
  void id; void updatedAt;
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">SEO Settings</h2>
      <p className="text-sm text-muted mb-6 max-w-[72ch]">
        These settings feed the page titles, descriptions, social previews, sitemap, robots file and structured data.
        They give search engines accurate information; they cannot guarantee a ranking.
      </p>
      <SeoForm initial={seo} siteUrl={process.env.NEXT_PUBLIC_SITE_URL || ''} />
    </div>
  );
}
