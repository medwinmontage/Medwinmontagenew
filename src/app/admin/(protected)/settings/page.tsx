import { prisma } from '@/lib/prisma';
import ContentForm from '@/components/admin/ContentForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const [content, offer] = await Promise.all([
    prisma.siteContent.findUnique({ where: { id: 'singleton' } }),
    prisma.offer.findFirst(),
  ]);
  if (!content || !offer) {
    return <p className="text-sm text-muted">Run <code>npm run db:seed</code> first to create initial content.</p>;
  }
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-6">Site Settings</h2>
      <p className="text-sm text-muted mb-6 max-w-[70ch]">Logo, contact details, WhatsApp, social links and site defaults. Page titles, location and search settings are under SEO Settings; banners have their own page.</p>
      <ContentForm
        section="settings"
        initialContent={content as any}
        initialOffer={{ id: offer.id, enabled: offer.enabled, text: offer.text, url: offer.url, endAt: offer.endAt.toISOString() }}
      />
    </div>
  );
}
