import { prisma } from '@/lib/prisma';
import ContentForm from '@/components/admin/ContentForm';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const [content, offer] = await Promise.all([
    prisma.siteContent.findUnique({ where: { id: 'singleton' } }),
    prisma.offer.findFirst(),
  ]);
  if (!content || !offer) {
    return <p className="text-sm text-muted">Run <code>npm run db:seed</code> first to create initial content.</p>;
  }
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-6">Content</h2>
      <ContentForm
        section="content"
        initialContent={content as any}
        initialOffer={{ id: offer.id, enabled: offer.enabled, text: offer.text, url: offer.url, endAt: offer.endAt.toISOString() }}
      />
    </div>
  );
}
