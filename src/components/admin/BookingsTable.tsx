'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UnifiedRow } from '@/lib/adminRows';
import { WORK_STATUSES, statusBadgeClass } from '@/lib/status';
import { FormError } from '@/components/ui/Field';

const TYPE_ENDPOINT: Record<UnifiedRow['source'], string> = { booking: '/api/bookings', lead: '/api/leads' };
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function BookingsTable({ rows, empty = 'No bookings yet.' }: { rows: UnifiedRow[]; empty?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function patch(row: UnifiedRow, body: Record<string, string>) {
    setBusy(row.id); setError('');
    const res = await fetch(`${TYPE_ENDPOINT[row.source]}/${row.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    setBusy(null);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setError(d?.error || 'The change could not be saved.'); return false; }
    router.refresh();
    return true;
  }
  async function remove(row: UnifiedRow) {
    if (!window.confirm(`Delete ${row.ref} (${row.name})? This cannot be undone.`)) return;
    setBusy(row.id); setError('');
    const res = await fetch(`${TYPE_ENDPOINT[row.source]}/${row.id}`, { method: 'DELETE' }).catch(() => null);
    setBusy(null);
    if (!res?.ok) { setError('The record could not be deleted.'); return; }
    router.refresh();
  }

  if (rows.length === 0) return <p className="empty">{empty}</p>;

  return (
    <>
      <FormError className="mb-4">{error}</FormError>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th><th>Customer</th><th>Type</th><th>Service / Event</th><th>Status</th><th>Created</th><th>Updated</th><th>Note to customer</th><th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-bold whitespace-nowrap">{r.ref}</td>
                <td>{r.name}<br /><span className="text-xs text-muted">{r.phone}<br />{r.email}</span></td>
                <td><span className="badge">{r.bookingType}</span></td>
                <td>{r.serviceOrEvent}<br /><span className="text-xs text-muted">{[r.date && `${r.date} ${r.time}`.trim(), r.location].filter(Boolean).join(' · ')}</span></td>
                <td>
                  <select disabled={busy === r.id} value={r.status} onChange={(e) => patch(r, { status: e.target.value })} aria-label={`Status for ${r.ref} (${r.name})`} className="input !w-auto !py-1.5 !px-2.5 !text-xs">
                    {WORK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <div className="mt-1.5"><span className={`badge ${statusBadgeClass(r.status)}`}>{r.status}</span></div>
                  {r.previousStatus && <div className="text-xs text-muted mt-1">Was: {r.previousStatus}</div>}
                </td>
                <td className="text-xs whitespace-nowrap">{when(r.createdAt)}</td>
                <td className="text-xs whitespace-nowrap">{when(r.updatedAt)}</td>
                <td className="min-w-[200px]">
                  {noteFor === r.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea className="input !text-xs !min-h-[64px]" aria-label={`Note to customer for ${r.ref}`} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
                      <div className="flex gap-2">
                        <button type="button" disabled={busy === r.id} className="btn btn-primary btn-sm" onClick={async () => { if (await patch(r, { adminNotes: note })) setNoteFor(null); }}>Save note</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNoteFor(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {r.adminNotes && <p className="text-xs whitespace-pre-wrap mb-1.5">{r.adminNotes}</p>}
                      <button type="button" className="link-plain text-xs font-bold underline" onClick={() => { setNoteFor(r.id); setNote(r.adminNotes); }}>{r.adminNotes ? 'Edit note' : 'Add note'}</button>
                    </>
                  )}
                </td>
                <td><button type="button" disabled={busy === r.id} onClick={() => remove(r)} className="btn btn-ghost btn-sm">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
