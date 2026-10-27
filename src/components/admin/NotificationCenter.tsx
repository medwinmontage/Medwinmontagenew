'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/site/Icon';
import { Field, FormError } from '@/components/ui/Field';
import NotificationList from '@/components/notify/NotificationList';
import { Notice, useNotifications } from '@/components/notify/useNotifications';
import { isSafeInternalPath } from '@/lib/links';

type Audience = 'customer' | 'crew' | 'all-customers' | 'all-crew';
type Person = { id: string; name: string; email: string };
const LABEL: Record<Audience, string> = { customer: 'One customer', crew: 'One crew member', 'all-customers': 'All customers', 'all-crew': 'All crew members' };

export default function NotificationCenter() {
  const params = useSearchParams();
  const { items, unread, markRead, markAll } = useNotifications('admin', 'mm-admin', { limit: 50 });

  const [audience, setAudience] = useState<Audience>('customer');
  const [recipientId, setRecipientId] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  // /admin/notifications?to=crew:ID or ?to=customer:ID opens the form already addressed.
  useEffect(() => {
    const to = params.get('to') || '';
    const [k, id] = to.split(':');
    if ((k === 'customer' || k === 'crew') && id) { setAudience(k); setRecipientId(id); }
  }, [params]);

  const single = audience === 'customer' || audience === 'crew';
  useEffect(() => {
    if (!single) { setPeople([]); return; }
    let live = true;
    fetch(`/api/admin/recipients?kind=${audience}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])).then((d) => { if (live) setPeople(d); }).catch(() => {});
    return () => { live = false; };
  }, [audience, single]);

  const chosen = useMemo(() => people.find((p) => p.id === recipientId), [people, recipientId]);

  function reply(n: Notice) {
    if (!n.from || (n.from.kind !== 'customer' && n.from.kind !== 'crew')) return;
    setAudience(n.from.kind); setRecipientId(n.from.id);
    setTitle(n.title.startsWith('Re:') ? n.title : `Re: ${n.title}`.slice(0, 140)); setBody(''); setDone(''); setError('');
    document.getElementById('compose')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (single && !recipientId) { setError('Please choose who to send this to.'); return; }
    if (title.trim().length < 2) { setError('Please add a title.'); return; }
    if (link.trim() && !isSafeInternalPath(link.trim())) { setError('The link must be a page on this site, for example /account or /crew.'); return; }
    setBusy(true); setError(''); setDone('');
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, ...(single ? { recipientId } : {}), title: title.trim(), body: body.trim() || undefined, link: link.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'The notification could not be sent.'); return; }
      setDone(`Sent to ${data.sent} ${data.sent === 1 ? 'person' : 'people'}${chosen ? ` (${chosen.name})` : ''}. They see it live.`);
      setTitle(''); setBody(''); setLink('');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid xl:grid-cols-2 gap-6 items-start">
      <section id="compose" className="card p-5 sm:p-6 flex flex-col gap-4 scroll-mt-24" aria-label="Send a notification">
        <h3 className="font-display font-bold text-lg">Send a notification</h3>
        <form noValidate onSubmit={send} className="flex flex-col gap-4">
          <Field label="Send to">
            <select className="input" value={audience} onChange={(e) => { setAudience(e.target.value as Audience); setRecipientId(''); setDone(''); }}>
              {(Object.keys(LABEL) as Audience[]).map((a) => <option key={a} value={a}>{LABEL[a]}</option>)}
            </select>
          </Field>
          {single && (
            <Field label={audience === 'customer' ? 'Customer' : 'Crew member'}>
              <select className="input" value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>
                <option value="">Choose…</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.email}</option>)}
              </select>
            </Field>
          )}
          <Field label="Title"><input className="input" maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Message (optional)"><textarea className="input min-h-[96px]" maxLength={1500} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
          <Field label="Open this page when clicked (optional)" hint="A page on this site, e.g. /account or /crew. Leave empty for the default."><input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/account" /></Field>
          <FormError>{error}</FormError>
          {done && <p role="status" className="text-sm font-bold text-[var(--ok)] inline-flex items-center gap-2"><Icon name="check" className="w-4 h-4" /> {done}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary sm:self-start"><Icon name="send" /> {busy ? 'Sending…' : 'Send notification'}</button>
        </form>
      </section>

      <section className="card overflow-hidden" aria-label="Admin inbox">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
          <h3 className="font-display font-bold text-lg">Inbox {unread > 0 && <span className="badge badge-solid ml-1.5 align-middle">{unread} new</span>}</h3>
          <button type="button" onClick={markAll} disabled={unread === 0} className="btn btn-ghost btn-sm">Mark all read</button>
        </div>
        <NotificationList
          items={items}
          empty="Nothing yet. New bookings, requests, reviews, crew applications and messages from customers and crew appear here live."
          onOpen={(n) => { if (!n.read) markRead(n.id); if (n.link && isSafeInternalPath(n.link)) window.location.assign(n.link); }}
          renderAction={(n) => (n.from && (n.from.kind === 'customer' || n.from.kind === 'crew') ? (
            <button type="button" onClick={() => reply(n)} className="text-[11.5px] font-bold text-accent-ink underline-offset-2 hover:underline inline-flex items-center gap-1"><Icon name="send" className="w-3 h-3" /> Reply</button>
          ) : null)}
        />
      </section>
    </div>
  );
}
