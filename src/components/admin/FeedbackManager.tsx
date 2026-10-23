'use client';
import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/site/Icon';
import { FormError } from '@/components/ui/Field';
import { useLiveUpdates } from '@/components/ui/LiveRefresh';
import { FEEDBACK_STATUSES, statusBadgeClass } from '@/lib/status';

type Row = { id: string; customerName: string; customerEmail: string; rating: number; text: string; relatedRef: string | null; allowPublic: boolean; status: string; createdAt: string };

export default function FeedbackManager() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/feedback', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) { setError('Feedback could not be loaded.'); return; }
    setRows(await res.json()); setError('');
  }, []);
  useEffect(() => { load(); }, [load]);
  useLiveUpdates('mm-admin', load);

  async function call(id: string, init: RequestInit) {
    setError('');
    const res = await fetch(`/api/feedback/${id}`, init).catch(() => null);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setError(d?.error || 'The change could not be saved.'); return false; }
    await load();
    return true;
  }
  const patch = (id: string, body: object) => call(id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  if (!rows) return error ? <FormError>{error}</FormError> : <p className="text-sm text-muted" role="status">Loading…</p>;
  const shown = filter === 'All' ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <FormError className="mb-4">{error}</FormError>
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter by status">
        {['All', ...FEEDBACK_STATUSES].map((s) => (
          <button key={s} type="button" className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>
            {s} ({s === 'All' ? rows.length : rows.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className="empty">{rows.length === 0 ? 'No feedback yet. Reviews sent from the customer portal appear here.' : 'No feedback with this status.'}</p> : (
        <div className="flex flex-col gap-3">
          {shown.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-bold">{r.customerName} <span className="text-xs text-muted font-normal">{r.customerEmail}</span></p>
                  <p className="flex items-center gap-2 text-xs text-muted mt-1">
                    <span className="inline-flex gap-0.5 text-accent" role="img" aria-label={`${r.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-current' : 'opacity-40'}`} />)}</span>
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}{r.relatedRef ? ` · about ${r.relatedRef}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`badge ${statusBadgeClass(r.status)}`}>{r.status}</span>
                  <span className="badge badge-neutral">{r.allowPublic ? 'May be shown publicly' : 'Private — do not publish'}</span>
                </div>
              </div>
              {editing === r.id ? (
                <div className="flex flex-col gap-2">
                  <textarea className="input" aria-label="Review text" value={draft} maxLength={2000} onChange={(e) => setDraft(e.target.value)} />
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-primary btn-sm" onClick={async () => { if (await patch(r.id, { text: draft })) setEditing(null); }}>Save text</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </div>
              ) : <p className="text-sm whitespace-pre-wrap">{r.text}</p>}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
                {r.status !== 'Approved' && <button type="button" className="btn btn-primary btn-sm" onClick={() => patch(r.id, { status: 'Approved' })}><Icon name="check" /> Approve</button>}
                {r.status !== 'Rejected' && <button type="button" className="btn btn-ghost btn-sm" onClick={() => patch(r.id, { status: 'Rejected' })}>Reject</button>}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(r.id); setDraft(r.text); }}><Icon name="edit" /> Edit</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm(`Delete this review from ${r.customerName}?`)) call(r.id, { method: 'DELETE' }); }}><Icon name="trash" /> Delete</button>
              </div>
              {r.status === 'Approved' && <p className="hint">{r.allowPublic ? 'Showing in the Reviews section of the website.' : 'Approved, but the customer asked for it to stay private, so it is not shown on the website.'}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
