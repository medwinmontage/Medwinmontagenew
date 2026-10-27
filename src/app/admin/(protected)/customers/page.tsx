import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, phone: true, status: true, createdAt: true, lastLogin: true,
      _count: { select: { bookings: true, leads: true, quoteRequests: true } },
    },
  });
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-6">Registered Customers</h2>
      {customers.length === 0 ? (
        <p className="empty">No registered customers yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th><th>Last Login</th><th>Status</th><th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line/50">
                  <td className="text-xs text-muted">{c.id}</td><td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td>
                  <td>{c.createdAt.toLocaleDateString()}</td>
                  <td>{c.lastLogin ? c.lastLogin.toLocaleString() : '—'}</td>
                  <td><span className={`badge ${c.status === 'Active' ? 'badge-ok' : 'badge-bad'}`}>{c.status}</span></td>
                  <td className="text-[12.5px] text-muted">{c._count.bookings} bookings, {c._count.leads} leads, {c._count.quoteRequests} quotes</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
