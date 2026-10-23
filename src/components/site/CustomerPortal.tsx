'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { Field, FormError } from '@/components/ui/Field';
import StatusTimeline, { StatusBadge } from '@/components/ui/StatusTimeline';
import { useLiveUpdates } from '@/components/ui/LiveRefresh';
import { STATUS_HELP, WorkStatus } from '@/lib/status';
import NotificationsPanel from '@/components/notify/NotificationsPanel';
import MessageAdminCard from '@/components/notify/MessageAdminCard';

type Profile = { name: string; email: string; phone: string; company: string; city: string; state: string; status: string; createdAt: string };
type Work = {
  ref: string; kind: 'Event Booking' | 'Service Request' | 'Offer Booking'; title: string; status: WorkStatus; note: string;
  location: string; createdAt: string; updatedAt: string;
  eventDate?: string; eventTime?: string; budget?: string; notes?: string; company?: string; categories?: string[];
  items?: Record<string, string[]>; details?: Record<string, unknown>;
};
type Quote = { ref: string; company: string; phone: string; whatsapp: string; status: string; createdAt: string; updatedAt: string };
type Review = { id: string; rating: number; text: string; relatedRef: string; allowPublic: boolean; status: string; createdAt: string };
type Data = { profile: Profile; bookings: Work[]; services: Work[]; quotes: Quote[]; feedback: Review[] };

const TABS = [
  ['dashboard', 'Dashboard', 'grid'], ['profile', 'Profile', 'user'], ['bookings', 'Bookings', 'calendar'],
  ['services', 'Service History', 'layers'], ['quotes', 'Quote Requests', 'receipt'], ['activity', 'Activity', 'clock'], ['notifications', 'Notifications', 'bell'], ['feedback', 'Feedback', 'star'],
] as const;
type Tab = (typeof TABS)[number][0];

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDay = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? fmt(`${d}T00:00:00`) : d);

function Empty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="empty"><p>{children}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted">{label}</dt><dd className="text-sm font-semibold break-words">{children}</dd></div>;
}

function WorkCard({ w, reviewed, onReview }: { w: Work; reviewed: boolean; onReview: (ref: string) => void }) {
  const picked = w.items ? Object.values(w.items).flat().filter((x) => typeof x === 'string') : [];
  const details = w.details ? Object.entries(w.details).filter(([, v]) => typeof v === 'string' && v) as [string, string][] : [];
  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted">{w.kind} · #{w.ref}</p>
          <h3 className="font-display font-bold text-lg sm:text-xl mt-1 break-words">{w.title || w.kind}</h3>
        </div>
        <StatusBadge status={w.status} />
      </div>
      <StatusTimeline status={w.status} />
      <p className="text-sm text-muted mt-4">{STATUS_HELP[w.status]}</p>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4 mt-5 pt-5 border-t border-line">
        {w.eventDate && <Fact label="Event date">{fmtDay(w.eventDate)}{w.eventTime ? `, ${w.eventTime}` : ''}</Fact>}
        <Fact label="Location">{w.location || '—'}</Fact>
        {w.budget ? <Fact label="Budget">{w.budget}</Fact> : null}
        {w.company ? <Fact label="Company">{w.company}</Fact> : null}
        <Fact label="Requested on">{fmt(w.createdAt)}</Fact>
        <Fact label={w.status === 'Completed' ? 'Completed on' : 'Last updated'}>{fmt(w.updatedAt)}</Fact>
      </dl>
      {picked.length > 0 && <p className="text-sm mt-4"><span className="text-muted">Selected items: </span>{picked.join(', ')}</p>}
      {details.map(([k, v]) => <p key={k} className="text-sm mt-2"><span className="text-muted">{k}: </span>{v}</p>)}
      {w.notes && <p className="text-sm mt-4"><span className="text-muted">Your notes: </span>{w.notes}</p>}
      {w.note && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <p className="text-xs font-bold text-accent-ink mb-1">Note from Medwin Montage</p>
          <p className="whitespace-pre-wrap">{w.note}</p>
        </div>
      )}
      {w.status === 'Completed' && (
        <div className="mt-5">
          {reviewed ? <span className="badge badge-ok"><Icon name="check" className="w-3 h-3" /> You reviewed this</span>
            : <button type="button" className="btn btn-secondary btn-sm" onClick={() => onReview(w.ref)}><Icon name="star" /> {w.kind === 'Event Booking' ? 'Review This Event' : 'Review This Service'}</button>}
        </div>
      )}
    </article>
  );
}

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  if (!onChange) {
    return <span className="inline-flex gap-0.5 text-accent" role="img" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" className={`w-4 h-4 ${n <= value ? 'fill-current' : 'opacity-40'}`} />)}</span>;
  }
  return (
    <fieldset>
      <legend className="label">Rating *</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-lg p-1.5 text-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
            <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            <Icon name="star" className={`w-7 h-7 transition-transform ${n <= value ? 'fill-current scale-105' : 'opacity-50'}`} />
            <span className="sr-only">{n} star{n > 1 ? 's' : ''}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function CustomerPortal({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/customer/overview', { cache: 'no-store' });
      if (res.status === 401) { router.refresh(); return; }
      if (!res.ok) throw new Error();
      setData(await res.json()); setLoadError('');
    } catch {
      setLoadError('Your account details could not be loaded. Check your connection and try again.');
    }
  }, [router]);
  useEffect(() => { load(); }, [load]);
  useLiveUpdates(`mm-customer-${customerId}`, load);

  // ---- profile form
  const [form, setForm] = useState({ name: '', company: '', city: '', state: '' });
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const profileKey = data ? `${data.profile.name}|${data.profile.company}|${data.profile.city}|${data.profile.state}` : '';
  useEffect(() => { if (data) setForm({ name: data.profile.name, company: data.profile.company, city: data.profile.city, state: data.profile.state }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profileKey]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) { setProfileMsg({ ok: false, text: 'Please enter your name.' }); return; }
    setSaving(true); setProfileMsg(null);
    try {
      const res = await fetch('/api/customer/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json().catch(() => ({}));
      setProfileMsg(res.ok ? { ok: true, text: 'Profile saved.' } : { ok: false, text: d.error || 'Your profile could not be saved.' });
      if (res.ok) load();
    } catch { setProfileMsg({ ok: false, text: 'We could not reach the server. Try again.' }); }
    finally { setSaving(false); }
  }

  // ---- feedback form
  const [fb, setFb] = useState({ rating: 0, text: '', relatedRef: '', allowPublic: true });
  const [fbMsg, setFbMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fbSaving, setFbSaving] = useState(false);
  function startReview(ref: string) { setFb((f) => ({ ...f, relatedRef: ref })); setFbMsg(null); setTab('feedback'); window.scrollTo({ top: 0 }); }
  async function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (fbSaving) return;
    if (fb.rating < 1) { setFbMsg({ ok: false, text: 'Please choose a rating.' }); return; }
    if (fb.text.trim().length < 5) { setFbMsg({ ok: false, text: 'Please write a few words about your experience.' }); return; }
    setFbSaving(true); setFbMsg(null);
    try {
      const res = await fetch('/api/customer/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: fb.rating, text: fb.text, allowPublic: fb.allowPublic, ...(fb.relatedRef ? { relatedRef: fb.relatedRef } : {}) }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setFbMsg({ ok: false, text: d.error || 'Your feedback could not be sent.' }); return; }
      setFbMsg({ ok: true, text: 'Feedback sent. Thank you!' });
      setFb({ rating: 0, text: '', relatedRef: '', allowPublic: true });
      load();
    } catch { setFbMsg({ ok: false, text: 'We could not reach the server. Try again.' }); }
    finally { setFbSaving(false); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'customer' }) });
    window.dispatchEvent(new Event('mm-auth'));
    router.push('/'); router.refresh();
  }

  const derived = useMemo(() => {
    if (!data) return null;
    const all = [...data.bookings, ...data.services];
    const reviewedRefs = new Set(data.feedback.map((f) => f.relatedRef).filter(Boolean));
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = data.bookings.filter((b) => (b.eventDate || '') >= today && b.status !== 'Cancelled' && b.status !== 'Rejected' && b.status !== 'Completed')
      .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''))[0];
    const activity = [
      ...all.map((w) => ({ ref: w.ref, kind: w.kind, title: w.title, status: w.status as string, date: w.updatedAt, extra: w.eventDate ? `Event date: ${fmtDay(w.eventDate)}` : '' })),
      ...data.quotes.map((q) => ({ ref: q.ref, kind: 'Quote Request', title: q.company || 'Quote request', status: q.status, date: q.updatedAt, extra: '' })),
      ...data.feedback.map((f) => ({ ref: f.relatedRef || 'Feedback', kind: 'Feedback', title: `${f.rating}/5 stars`, status: f.status, date: f.createdAt, extra: '' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return {
      all, reviewedRefs, upcoming, activity,
      active: all.filter((w) => w.status === 'Processing'),
      completed: all.filter((w) => w.status === 'Completed'),
      reviewable: all.filter((w) => w.status === 'Completed' && !reviewedRefs.has(w.ref)),
    };
  }, [data]);

  const nav = (
    <>
      {TABS.map(([id, label, icon]) => (
        <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls="portal-panel" onClick={() => setTab(id)}
          className="side-link whitespace-nowrap flex-shrink-0">
          <Icon name={icon} /> {label}
        </button>
      ))}
      <button type="button" onClick={logout} className="side-link whitespace-nowrap flex-shrink-0 lg:mt-3 lg:border-t lg:border-line lg:rounded-none lg:pt-4"><Icon name="logout" /> Logout</button>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
      <div role="tablist" aria-label="Customer portal" aria-orientation="vertical"
        className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 pb-3 lg:pb-0 mb-5 lg:mb-0 lg:sticky lg:top-24 lg:self-start">
        {nav}
      </div>

      <div id="portal-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="min-w-0">
        {loadError && <FormError className="mb-5">{loadError}</FormError>}
        {!data || !derived ? (
          !loadError && (
            <div aria-busy="true" role="status" className="grid sm:grid-cols-2 gap-4">
              <span className="sr-only">Loading your account…</span>
              {[0, 1, 2, 3].map((n) => <div key={n} className="card h-28 animate-pulse bg-paper-2" />)}
            </div>
          )
        ) : (
          <>
            {tab === 'dashboard' && (
              <div>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-1">Hello, {data.profile.name.split(' ')[0]}</h1>
                <p className="text-muted mb-7">Here is where everything stands.</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {([
                    ['Upcoming booking', derived.upcoming ? fmtDay(derived.upcoming.eventDate || '') : 'None', derived.upcoming ? derived.upcoming.title : 'No event booked', 'bookings'],
                    ['Active projects', String(derived.active.length), 'Being worked on now', 'activity'],
                    ['Completed projects', String(derived.completed.length), 'Finished work', 'activity'],
                    ['Service requests', String(data.services.length), 'Services and offers', 'services'],
                    ['Quote requests', String(data.quotes.length), 'Package quotes', 'quotes'],
                    ['Feedback', String(data.feedback.length), derived.reviewable.length ? `${derived.reviewable.length} waiting for your review` : 'Reviews you have sent', 'feedback'],
                  ] as const).map(([label, value, sub, to]) => (
                    <button key={label} type="button" onClick={() => setTab(to)} className="card card-hover p-4 sm:p-5 text-left">
                      <span className="block text-xs font-bold text-muted">{label}</span>
                      <b className="block font-display font-extrabold text-2xl sm:text-3xl text-accent-ink my-1 break-words">{value}</b>
                      <span className="block text-xs text-muted">{sub}</span>
                    </button>
                  ))}
                </div>
                <div className="card p-5 flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-muted">Profile</p>
                    <p className="font-bold truncate">{data.profile.name}</p>
                    <p className="text-sm text-muted truncate">{data.profile.email} · {data.profile.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('profile')}>View profile</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('feedback')}><Icon name="star" /> Give Feedback</button>
                  </div>
                </div>
                <h2 className="font-display font-bold text-xl mb-4">My Activity</h2>
                <ActivityList items={derived.activity.slice(0, 4)} />
                {derived.activity.length > 4 && <button type="button" className="link-accent text-sm mt-4" onClick={() => setTab('activity')}>See all activity <Icon name="arrow-right" /></button>}
              </div>
            )}

            {tab === 'profile' && (
              <div className="max-w-2xl">
                <h1 className="font-display font-extrabold text-3xl mb-6">My Profile</h1>
                <dl className="card p-5 sm:p-6 grid sm:grid-cols-2 gap-5 mb-6">
                  <div>
                    <Fact label="Email">{data.profile.email}</Fact>
                    <p className="hint">Contact admin to change your email.</p>
                  </div>
                  <div>
                    <Fact label="Phone Number">{data.profile.phone}</Fact>
                    <p className="hint">Contact admin to change your phone number.</p>
                  </div>
                  <Fact label="Account status"><StatusBadge status={data.profile.status} /></Fact>
                  <Fact label="Account created">{fmt(data.profile.createdAt)}</Fact>
                </dl>
                <form noValidate onSubmit={saveProfile} className="card p-5 sm:p-6 flex flex-col gap-4">
                  <h2 className="font-display font-bold text-lg">Details you can edit</h2>
                  <Field label="Full Name *"><input className="input" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
                  <Field label="Company"><input className="input" autoComplete="organization" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} /></Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="City"><input className="input" autoComplete="address-level2" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></Field>
                    <Field label="State"><input className="input" autoComplete="address-level1" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></Field>
                  </div>
                  {profileMsg && (profileMsg.ok
                    ? <p role="status" className="badge badge-ok self-start !text-sm !py-1.5 !px-3"><Icon name="check" className="w-4 h-4" /> {profileMsg.text}</p>
                    : <FormError>{profileMsg.text}</FormError>)}
                  <button type="submit" disabled={saving} className="btn btn-primary sm:self-start">{saving ? 'Saving…' : 'Save Changes'}</button>
                </form>
              </div>
            )}

            {tab === 'bookings' && (
              <div>
                <h1 className="font-display font-extrabold text-3xl mb-6">Event Bookings</h1>
                {data.bookings.length === 0
                  ? <Empty action={<a href="/" className="btn btn-primary btn-sm">Book an event</a>}>You have no event bookings yet. Bookings you make while logged in appear here.</Empty>
                  : <div className="flex flex-col gap-5">{data.bookings.map((w) => <WorkCard key={w.ref} w={w} reviewed={derived.reviewedRefs.has(w.ref)} onReview={startReview} />)}</div>}
              </div>
            )}

            {tab === 'services' && (
              <div>
                <h1 className="font-display font-extrabold text-3xl mb-6">Service History</h1>
                {data.services.length === 0
                  ? <Empty action={<a href="/#services" className="btn btn-primary btn-sm">See our services</a>}>You have no service or offer requests yet.</Empty>
                  : <div className="flex flex-col gap-5">{data.services.map((w) => <WorkCard key={w.ref} w={w} reviewed={derived.reviewedRefs.has(w.ref)} onReview={startReview} />)}</div>}
              </div>
            )}

            {tab === 'quotes' && (
              <div>
                <h1 className="font-display font-extrabold text-3xl mb-6">Quote Requests</h1>
                {data.quotes.length === 0
                  ? <Empty action={<a href="/#packages" className="btn btn-primary btn-sm">See packages</a>}>You have not asked for a quote yet.</Empty>
                  : <div className="grid sm:grid-cols-2 gap-4">{data.quotes.map((q) => (
                      <article key={q.ref} className="card p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <h3 className="font-display font-bold text-lg">Quote #{q.ref}</h3>
                          <StatusBadge status={q.status} />
                        </div>
                        <dl className="grid grid-cols-2 gap-4">
                          <Fact label="Requested on">{fmt(q.createdAt)}</Fact>
                          <Fact label="Company">{q.company || '—'}</Fact>
                          <Fact label="Phone">{q.phone}</Fact>
                          <Fact label="WhatsApp">{q.whatsapp}</Fact>
                        </dl>
                      </article>
                    ))}</div>}
              </div>
            )}

            {tab === 'activity' && (
              <div>
                <h1 className="font-display font-extrabold text-3xl mb-6">My Activity</h1>
                <ActivityList items={derived.activity} />
              </div>
            )}

            {tab === 'notifications' && (
              <div className="max-w-2xl flex flex-col gap-6">
                <h1 className="font-display font-extrabold text-3xl">Notifications</h1>
                <NotificationsPanel kind="customer" topic={`mm-customer-${customerId}`} />
                <MessageAdminCard kind="customer" />
              </div>
            )}

            {tab === 'feedback' && (
              <div className="max-w-2xl">
                <h1 className="font-display font-extrabold text-3xl mb-6">Review / Feedback</h1>
                <form noValidate onSubmit={sendFeedback} className="card p-5 sm:p-6 flex flex-col gap-4 mb-8">
                  <h2 className="font-display font-bold text-lg">Give Feedback</h2>
                  <p className="text-sm text-muted -mt-2">Posting as {data.profile.name}.</p>
                  <Stars value={fb.rating} onChange={(n) => setFb((f) => ({ ...f, rating: n }))} />
                  {derived.reviewable.length > 0 && (
                    <Field label="About (optional)">
                      <select className="input" value={fb.relatedRef} onChange={(e) => setFb((f) => ({ ...f, relatedRef: e.target.value }))}>
                        <option value="">Medwin Montage in general</option>
                        {derived.reviewable.map((w) => <option key={w.ref} value={w.ref}>{w.ref} — {w.title || w.kind}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field label="Your review *"><textarea className="input min-h-[120px]" maxLength={2000} value={fb.text} onChange={(e) => setFb((f) => ({ ...f, text: e.target.value }))} /></Field>
                  <label className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" className="mt-0.5" checked={fb.allowPublic} onChange={(e) => setFb((f) => ({ ...f, allowPublic: e.target.checked }))} />
                    <span>Medwin Montage may show this review on the website with my name, once approved.</span>
                  </label>
                  {fbMsg && (fbMsg.ok
                    ? <p role="status" className="badge badge-ok self-start !text-sm !py-1.5 !px-3"><Icon name="check" className="w-4 h-4" /> {fbMsg.text}</p>
                    : <FormError>{fbMsg.text}</FormError>)}
                  <button type="submit" disabled={fbSaving} className="btn btn-primary sm:self-start">{fbSaving ? 'Sending…' : 'Send feedback'}</button>
                </form>
                <h2 className="font-display font-bold text-xl mb-4">Feedback you have sent</h2>
                {data.feedback.length === 0 ? <Empty>You have not sent any feedback yet.</Empty> : (
                  <div className="flex flex-col gap-3">{data.feedback.map((f) => (
                    <article key={f.id} className="card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <Stars value={f.rating} />
                        <span className="flex items-center gap-2 text-xs text-muted">{fmt(f.createdAt)} <StatusBadge status={f.status === 'Pending' ? 'Awaiting approval' : f.status} /></span>
                      </div>
                      {f.relatedRef && <p className="text-xs font-bold text-muted mb-1">About #{f.relatedRef}</p>}
                      <p className="text-sm whitespace-pre-wrap">{f.text}</p>
                    </article>
                  ))}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ActivityList({ items }: { items: { ref: string; kind: string; title: string; status: string; date: string; extra: string }[] }) {
  if (items.length === 0) return <Empty>Nothing here yet. Bookings, service requests and quotes you make while logged in will appear here.</Empty>;
  return (
    <ol className="relative flex flex-col gap-3 before:absolute before:left-[9px] before:top-3 before:bottom-3 before:w-px before:bg-line-strong">
      {items.map((a, i) => (
        <li key={`${a.kind}-${a.ref}-${i}`} className="relative pl-8">
          <span aria-hidden className="absolute left-0 top-5 w-[19px] h-[19px] rounded-full border-2 border-accent bg-card" />
          <div className="card p-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted">{a.kind} · #{a.ref}</p>
              <p className="font-bold break-words">{a.title}</p>
              <p className="text-xs text-muted mt-0.5">{a.extra ? `${a.extra} · ` : ''}Last updated {fmt(a.date)}</p>
            </div>
            <StatusBadge status={a.status} />
          </div>
        </li>
      ))}
    </ol>
  );
}
