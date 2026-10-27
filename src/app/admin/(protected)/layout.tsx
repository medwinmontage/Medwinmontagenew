import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/session';
import LiveRefresh from '@/components/ui/LiveRefresh';
import Sidebar from '@/components/admin/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // The /admin/login page renders its own minimal shell — everything else
  // requires a valid session. (middleware.ts also enforces this at the edge;
  // this is a defense-in-depth check for direct server-side rendering.)
  if (!session) {
    redirect('/admin/login');
    return null; // unreachable — redirect() throws — but keeps this explicit for anyone reading it
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar username={session.username} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      {/* New bookings, quotes, applications and reviews appear without a manual reload. */}
      <LiveRefresh topic="mm-admin" />
    </div>
  );
}
