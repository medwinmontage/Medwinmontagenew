'use client';
import { useState } from 'react';
import { useModals } from './ModalContext';
import { openWhatsApp, buildEventWhatsAppMessage } from '@/lib/whatsapp';
import Modal from '@/components/ui/Modal';
import { Field, FormError, SuccessMark } from '@/components/ui/Field';
import Icon from './Icon';

const BUDGETS = ['Under ₹10,000', '₹10,000 – ₹25,000', '₹25,000 – ₹75,000', '₹75,000+', 'Not sure yet', 'Custom Budget'];

export default function BookingModal({ eventTypes, whatsappNumber }: { eventTypes: { id: string; name: string }[]; whatsappNumber?: string }) {
  const { state, closeBooking } = useModals();
  const [form, setForm] = useState({ eventType: '', eventDate: '', eventTime: '', location: '', budget: '', notes: '', name: '', phone: '', email: '' });
  const [customBudget, setCustomBudget] = useState('');
  const [customBudgetError, setCustomBudgetError] = useState('');
  const [result, setResult] = useState<{ ref: string; status: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    setError('');
    if (!form.eventType || !form.eventDate || !form.location || !form.name || !form.phone || !form.email) {
      setError('Please fill all required fields.');
      return;
    }
    let finalBudget = form.budget;
    if (form.budget === 'Custom Budget') {
      const amount = parseFloat(customBudget);
      if (!customBudget || isNaN(amount) || amount <= 0) {
        setCustomBudgetError('Please enter a valid budget amount.');
        return;
      }
      setCustomBudgetError('');
      finalBudget = `₹${amount.toLocaleString('en-IN')} (custom)`;
    }
    if (loading) return;
    setLoading(true);
    const payload = { ...form, budget: finalBudget };
    const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
    setResult({ ref: data.ref, status: data.status });
    const message = buildEventWhatsAppMessage({ ...payload, ref: data.ref });
    setLastMessage(message);
    openWhatsApp(message, whatsappNumber);
  }

  function close() {
    setResult(null); setCustomBudget(''); setCustomBudgetError('');
    setForm({ eventType: '', eventDate: '', eventTime: '', location: '', budget: '', notes: '', name: '', phone: '', email: '' });
    closeBooking();
  }

  return (
    <Modal open={state.booking} onClose={close} title="Book For Event" size="md">
      {result ? (
        <div className="text-center py-3">
          <SuccessMark />
          <h4 className="font-display font-bold text-2xl mb-2">Booking request sent</h4>
          <p className="text-sm text-muted mb-4">We&rsquo;ll call {form.phone} to confirm your booking.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="badge badge-solid">Request received</span>
            <span className="badge badge-neutral">Reference: {result.ref}</span>
          </div>
          <p className="text-xs text-muted mt-6 mb-2">Opening WhatsApp to confirm your booking…</p>
          <button type="button" onClick={() => openWhatsApp(lastMessage, whatsappNumber)} className="btn btn-secondary btn-sm"><Icon name="chat" /> Open WhatsApp manually</button>
        </div>
      ) : (
        <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-4">
          <Field label="Event type *">
            <select className="input" value={form.eventType} onChange={(e) => update('eventType', e.target.value)}>
              <option value="">Select an event type</option>
              {eventTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
            <Field label="Preferred date *"><input type="date" className="input" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} /></Field>
            <Field label="Preferred time"><input type="time" className="input" value={form.eventTime} onChange={(e) => update('eventTime', e.target.value)} /></Field>
          </div>
          <Field label="Location *"><input className="input" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Venue, city" /></Field>
          <Field label="Budget">
            <select className="input" value={form.budget} onChange={(e) => update('budget', e.target.value)}>
              <option value="">Select a range</option>
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          {form.budget === 'Custom Budget' && (
            <div>
              <Field label="Enter your budget in ₹">
                <input type="number" min="1" inputMode="numeric" className="input" aria-invalid={!!customBudgetError} value={customBudget} onChange={(e) => setCustomBudget(e.target.value)} placeholder="e.g. 15000" />
              </Field>
              <FormError className="mt-2">{customBudgetError}</FormError>
            </div>
          )}
          <Field label="Additional notes"><textarea className="input" value={form.notes} onChange={(e) => update('notes', e.target.value)} /></Field>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
            <Field label="Name *"><input className="input" autoComplete="name" value={form.name} onChange={(e) => update('name', e.target.value)} /></Field>
            <Field label="Phone *"><input type="tel" className="input" autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
          </div>
          <Field label="Email *"><input type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></Field>
          <FormError>{error}</FormError>
          <button type="submit" disabled={loading} className="btn btn-primary btn-cta btn-lg">
            {loading ? 'Submitting…' : 'Submit Booking Request'}
          </button>
        </form>
      )}
    </Modal>
  );
}
