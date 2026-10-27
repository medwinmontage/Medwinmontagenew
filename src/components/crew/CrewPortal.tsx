'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/site/Icon';
import { CrewTimeline, StatusBadge } from '@/components/ui/StatusTimeline';
import { useLiveUpdates } from '@/components/ui/LiveRefresh';
import NotificationsPanel from '@/components/notify/NotificationsPanel';
import MessageAdminCard from '@/components/notify/MessageAdminCard';

type Me = {
  account: { name: string; email: string; phone: string; createdAt: string };
  application: { ref: string; role: string; status: string; experienceType: string; createdAt: string; updatedAt: string; hasResume: boolean } | null;
};
const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const HELP: Record<string, string> = {
  New: 'We have your application and will start reviewing it soon.',
  Reviewing: 'We are reviewing your application.',
  Shortlisted: 'You have been shortlisted. We will contact you soon.',
  Hired: 'Welcome to the crew! We will be in touch with the next steps.',
  Rejected: 'We are not able to take your application forward right now. Thank you for applying.',
};

export default function CrewPortal({ crewId }: { crewId: string }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/crew/me', { cache: 'no-store' });
      if (res.status === 401) { router.refresh(); return; }
      if (!res.ok) throw new Error();
      setMe(await res.json()); setError('');
    } catch { setError('Your crew dashboard could not be loaded. Check your connection and try again.'); }
  }, [router]);
  useEffect(() => { load(); }, [load]);
  // The admin changing the application's status updates this page live.
  useLiveUpdates(`mm-crew-${crewId}`, load);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'crew' }) });
    window.dispatchEvent(new Event('mm-auth'));
    router.refresh();
  }

  if (error) return <div className="max-w-3xl mx-auto px-5 py-16"><p role="alert" className="form-error"><Icon name="alert" /><span>{error}</span></p></div>;
  if (!me) return <div className="max-w-3xl mx-auto px-5 py-16 text-muted" role="status">Loading…</div>;
  const app = me.application;

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-10 pb-20 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-[-0.03em] break-words">Hello, {me.account.name.split(' ')[0]}</h1>
          <p className="text-muted text-sm mt-1 break-all">Crew account · {me.account.email} · {me.account.phone}</p>
        </div>
        <button type="button" onClick={logout} className="btn btn-secondary btn-sm"><Icon name="logout" /> Log out</button>
      </div>

      <section className="card p-5 sm:p-6" aria-label="Your application">
        {app ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted">Crew application · #{app.ref}</p>
                <h2 className="font-display font-bold text-xl mt-1">{app.role}</h2>
              </div>
              <StatusBadge status={app.status === 'New' ? 'Applied' : app.status} />
            </div>
            <CrewTimeline status={app.status} />
            <p className="text-sm text-muted mt-4">{HELP[app.status]}</p>
            <p className="text-xs text-muted mt-3">Sent on {fmt(app.createdAt)} · last updated {fmt(app.updatedAt)}</p>
          </>
        ) : (
          <div className="text-center py-4">
            <h2 className="font-display font-bold text-xl mb-2">You have not applied yet</h2>
            <p className="text-sm text-muted mb-5">Tell us about your skills and experience and we will get back to you.</p>
            <a href="/join-as-crew" className="btn btn-primary">Fill in the application <Icon name="arrow-right" /></a>
          </div>
        )}
      </section>

      <NotificationsPanel kind="crew" topic={`mm-crew-${crewId}`} />
      <MessageAdminCard kind="crew" />
    </div>
  );
}
