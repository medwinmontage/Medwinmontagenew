import { prisma } from '@/lib/prisma';
import RowActions from '@/components/admin/RowActions';
import { QUOTE_STATUSES } from '@/lib/status';

export const dynamic = 'force-dynamic';

export default async function AdminQuotesPage() {
  const quotes = await prisma.quoteRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-6">Quote Requests</h2>
      {quotes.length === 0 ? (
        <p className="empty">No quote requests yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Ref</th><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>WhatsApp</th><th>Received</th><th>Status</th></tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="font-bold whitespace-nowrap">{q.ref}</td><td>{q.name}</td><td>{q.company || '—'}</td>
                  <td>{q.email}</td><td>{q.phone}</td><td>{q.whatsapp}</td>
                  <td className="text-xs whitespace-nowrap">{q.createdAt.toLocaleString('en-IN')}</td>
                  <td><RowActions endpoint={`/api/quotes/${q.id}`} status={q.status} options={QUOTE_STATUSES} label={`Status for quote ${q.ref}`} confirmText={`Delete quote ${q.ref}? This cannot be undone.`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
