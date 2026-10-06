import { prisma } from '@/lib/prisma';
import BookingsTable from '@/components/admin/BookingsTable';
import Icon from '@/components/site/Icon';
import { bookingRow, leadRow, byNewest } from '@/lib/adminRows';

export const dynamic = 'force-dynamic';

// Every booking in one place: event bookings plus service / offer requests.
export default async function AdminBookingsPage() {
  const [bookings, leads] = await Promise.all([
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);
  const rows = [...bookings.map(bookingRow), ...leads.map(leadRow)].sort(byNewest);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl">Bookings</h2>
        <a href="/api/bookings/export" className="btn btn-primary"><Icon name="download" /> Export as Excel</a>
      </div>
      <p className="text-sm text-muted mb-5 max-w-[70ch]">Change a status here and the customer sees it in their portal straight away. The note is shown to the customer.</p>
      <BookingsTable rows={rows} />
    </div>
  );
}
