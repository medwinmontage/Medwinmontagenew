'use client';
import { useState } from 'react';
import { useModals } from './ModalContext';
import Modal from '@/components/ui/Modal';
import { Field, FormError, SuccessMark } from '@/components/ui/Field';

function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidPhone(v: string) { return /^[0-9+\-\s()]{7,15}$/.test(v); }

export default function QuoteModal() {
  const { state, closeQuote } = useModals();
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', whatsapp: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ref: string } | null>(null);

  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.name) { setError('Please enter your name.'); return; }
    if (!isValidEmail(form.email)) { setError('Please enter a valid email address.'); return; }
    if (!isValidPhone(form.phone)) { setError('Please enter a valid phone number.'); return; }
    if (!isValidPhone(form.whatsapp)) { setError('Please enter a valid WhatsApp number.'); return; }
    setError('');
    if (loading) return;
    setLoading(true);
    const res = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
    setResult({ ref: data.ref });
  }
  function close() { closeQuote(); setForm({ name: '', company: '', email: '', phone: '', whatsapp: '' }); setResult(null); setError(''); }

  return (
    <Modal open={state.quote} onClose={close} title="Request Quote" size="sm">
      {result ? (
        <div className="text-center py-3">
          <SuccessMark />
          <h4 className="font-display font-bold text-2xl mb-2">Quote request sent</h4>
          <p className="text-sm text-muted mb-4">We&rsquo;ll get back to you at <b className="text-ink">{form.email}</b> or on WhatsApp shortly.</p>
          <span className="badge badge-neutral">Reference: {result.ref}</span>
        </div>
      ) : (
        <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-4">
          <Field label="Name *"><input className="input" autoComplete="name" value={form.name} onChange={(e) => update('name', e.target.value)} /></Field>
          <Field label="Company Name (optional)"><input className="input" autoComplete="organization" value={form.company} onChange={(e) => update('company', e.target.value)} /></Field>
          <Field label="Email ID *"><input type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></Field>
          <Field label="Phone Number *"><input type="tel" className="input" autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
          <Field label="WhatsApp Number *"><input type="tel" className="input" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} /></Field>
          <FormError>{error}</FormError>
          <button type="submit" disabled={loading} className="btn btn-primary btn-cta btn-lg">{loading ? 'Submitting…' : 'Submit Request'}</button>
        </form>
      )}
    </Modal>
  );
}
