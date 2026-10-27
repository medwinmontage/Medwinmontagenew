import { prisma } from '@/lib/prisma';
import { normalizeStatus } from '@/lib/status';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [bookings, leads, quotes, customers, subscribers, offer, crewNew, feedbackPending] = await Promise.all([
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.quoteRequest.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.customer.count(),
    prisma.newsletterSubscriber.count(),
    prisma.offer.findFirst(),
    prisma.crewApplication.count({ where: { status: 'New' } }),
    prisma.feedback.count({ where: { status: 'Pending' } }),
  ]);

  const serviceLeads = leads.filter((l) => l.mode !== 'offer');
  const offerLeads = leads.filter((l) => l.mode === 'offer');
  const allStatuses = [...bookings.map((b) => normalizeStatus(b.status)), ...leads.map((l) => normalizeStatus(l.status))];
  const pending = allStatuses.filter((s) => s === 'Incomplete').length;
  const confirmed = allStatuses.filter((s) => s === 'Processing').length;
  const completed = allStatuses.filter((s) => s === 'Completed').length;
  const offerActive = !!offer?.enabled && offer.endAt.getTime() > Date.now();

  const recent = [
    ...bookings.map((b) => ({ date: b.createdAt, name: b.name, kind: 'Event Booking', detail: b.eventType })),
    ...leads.map((l) => ({ date: l.createdAt, name: l.name, kind: l.mode === 'offer' ? 'Offer Booking' : 'Service Booking', detail: l.categories.join(', ') })),
    ...quotes.map((q) => ({ date: q.createdAt, name: q.name, kind: 'Quote Request', detail: q.company || q.email })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);

  const stats = [
    ['Total customers', customers],
    ['Total bookings', bookings.length + leads.length],
    ['Service bookings', serviceLeads.length],
    ['Event bookings', bookings.length],
    ['Offer bookings', offerLeads.length],
    ['Total leads', serviceLeads.length],
    ['Incomplete', pending],
    ['Processing', confirmed],
    ['Completed', completed],
    ['Quote requests', quotes.length],
    ['New crew applications', crewNew],
    ['Reviews to approve', feedbackPending],
    ['Newsletter subscribers', subscribers],
    ['Current offer', offerActive ? 'Active' : 'Off'],
  ] as const;

  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(([label, value]) => (
          <div key={label} className="card card-hover p-5">
            <b className="block font-display font-extrabold text-3xl leading-tight text-accent-ink">{value}</b>
            <span className="text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>
      <div className="card p-6">
        <h4 className="font-display font-bold text-lg mb-4">Recent activity</h4>
        {recent.length === 0 ? (
          <p className="empty">
            No activity yet — bookings and wizard requests will show up here.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-2"><table className="table">
            <thead>
              <tr>
                <th>Type</th><th>Name</th><th>Details</th><th>Received</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i}>
                  <td>{r.kind}</td><td>{r.name}</td><td>{r.detail}</td><td>{r.date.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
