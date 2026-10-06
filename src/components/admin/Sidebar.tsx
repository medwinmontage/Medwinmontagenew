'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/site/Icon';
import ThemeToggle from '@/components/site/ThemeToggle';
import { BRAND_MARK } from '@/lib/brand';

const NAV = [
  ['/admin', 'Dashboard', 'grid'],
  ['/admin/content', 'Content', 'home'],
  ['/admin/services', 'Services', 'layers'],
  ['/admin/portfolio', 'Portfolio', 'film'],
  ['/admin/packages', 'Packages', 'package'],
  ['/admin/testimonials', 'Testimonials', 'chat'],
  ['/admin/faqs', 'FAQ', 'help'],
  ['/admin/eventTypes', 'Event Types', 'ticket'],
  ['/admin/bookings', 'Bookings', 'calendar'],
  ['/admin/leads', 'Leads / Service Requests', 'pen'],
  ['/admin/quotes', 'Quotes', 'receipt'],
  ['/admin/customers', 'Customers', 'users'],
  ['/admin/banners', 'Banners', 'image'],
  ['/admin/seo', 'SEO Settings', 'chart'],
  ['/admin/crew', 'Crew Applications', 'badge'],
  ['/admin/feedback', 'Reviews / Feedback', 'star'],
  ['/admin/settings', 'Site Settings', 'edit'],
] as const;

export default function Sidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // On small screens the sidebar is a collapsible top bar: close it after navigating.
  useEffect(() => { setOpen(false); }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'admin' }) });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="lg:w-[260px] lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto bg-paper-2 border-b lg:border-b-0 lg:border-r border-line flex flex-col p-3 lg:p-4 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-2 px-1.5 lg:pb-5">
        <div className="flex items-center gap-2.5">
          <img src={BRAND_MARK} alt="" width={32} height={32} className="h-8 w-8" />
          <b className="font-display font-extrabold text-[15px] tracking-tight">Admin Panel</b>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="!w-9 !h-9" />
          <button
            type="button"
            className="icon-btn !w-9 !h-9 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="admin-nav"
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      <div id="admin-nav" className={`${open ? 'flex' : 'hidden'} lg:flex flex-col flex-1 pt-3 lg:pt-0 max-h-[calc(100dvh-64px)] lg:max-h-none overflow-y-auto`}>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {NAV.map(([href, label, icon]) => (
            <Link key={href} href={href} className="side-link" aria-current={pathname === href ? 'page' : undefined}>
              <Icon name={icon} /> {label}
            </Link>
          ))}
          <a href="/" target="_blank" rel="noopener" className="side-link">
            <Icon name="external" /> View Site
          </a>
        </nav>
        <div className="mt-4 lg:mt-auto pt-4 border-t border-line flex flex-col gap-1">
          <div className="px-3 py-1.5 text-xs text-muted">Signed in as {username}</div>
          <button type="button" onClick={logout} className="side-link"><Icon name="logout" /> Logout</button>
        </div>
      </div>
    </aside>
  );
}
