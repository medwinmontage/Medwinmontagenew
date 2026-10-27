'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Status dropdown + delete for a server-rendered admin table row. */
export default function RowActions({ endpoint, status, options, label, confirmText }: {
  endpoint: string; status: string; options: readonly string[]; label: string; confirmText: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function call(init: RequestInit) {
    setBusy(true); setError('');
    const res = await fetch(endpoint, init).catch(() => null);
    setBusy(false);
    if (!res?.ok) { setError('Not saved — try again.'); return; }
    router.refresh();
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select disabled={busy} value={status} aria-label={label} className="input !w-auto !py-1.5 !px-2.5 !text-xs"
        onChange={(e) => call({ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: e.target.value }) })}>
        {options.map((s) => <option key={s}>{s}</option>)}
      </select>
      <button type="button" disabled={busy} className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm(confirmText)) call({ method: 'DELETE' }); }}>Delete</button>
      {error && <span role="alert" className="text-xs font-bold" style={{ color: 'var(--bad)' }}>{error}</span>}
    </div>
  );
}
