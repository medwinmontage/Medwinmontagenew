import { prisma } from '@/lib/prisma';
import BookingsTable from '@/components/admin/BookingsTable';
import { leadRow } from '@/lib/adminRows';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">Leads / Service Requests</h2>
      <p className="text-sm text-muted mb-5 max-w-[70ch]">Requests sent through &ldquo;Book Our Services&rdquo; and the offer waitlist.</p>
      <BookingsTable rows={leads.map(leadRow)} empty="No service requests yet." />
    </div>
  );
}
