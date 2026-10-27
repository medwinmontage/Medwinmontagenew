'use client';
import { useState } from 'react';
import { Field, FormError } from '@/components/ui/Field';
import Icon from '@/components/site/Icon';

/** A signed-in customer or crew member writes to the admin; it shows up live in the admin panel. */
export default function MessageAdminCard({ kind }: { kind: 'customer' | 'crew' }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (text.trim().length < 2) { setError('Please write your message.'); return; }
    setBusy(true); setError(''); setSent(false);
    try {
      const res = await fetch(`/api/notifications/message?kind=${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'The message could not be sent.'); return; }
      setText(''); setSent(true);
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={send} className="card p-5 sm:p-6 flex flex-col gap-4">
      <div>
        <h3 className="font-display font-bold text-lg">Message the Medwin Montage team</h3>
        <p className="text-sm text-muted mt-1">Your message reaches our admin panel straight away. Replies appear in your notifications.</p>
      </div>
      <Field label="Your message"><textarea className="input min-h-[96px]" maxLength={1500} value={text} onChange={(e) => { setText(e.target.value); setSent(false); }} /></Field>
      <FormError>{error}</FormError>
      {sent && <p role="status" className="text-sm font-bold text-[var(--ok)] inline-flex items-center gap-2"><Icon name="check" className="w-4 h-4" /> Sent — we will reply here.</p>}
      <button type="submit" disabled={busy} className="btn btn-primary sm:self-start"><Icon name="send" /> {busy ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
