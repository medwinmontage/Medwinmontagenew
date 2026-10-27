import type { Metadata } from 'next';
import { requireCustomer } from '@/lib/session';
import SiteBar from '@/components/site/SiteBar';
import CustomerPortal from '@/components/site/CustomerPortal';
import AccountGate from '@/components/site/AccountGate';

export const dynamic = 'force-dynamic';

// Private page: never indexed, and every request re-checks the session.
export const metadata: Metadata = { title: 'My Account', robots: { index: false, follow: false } };

export default async function AccountPage() {
  const customer = await requireCustomer();
  return (
    <>
      <SiteBar />
      <main className="relative min-h-[70vh]">
        {customer ? <CustomerPortal customerId={customer.id} /> : <AccountGate />}
      </main>
    </>
  );
}
