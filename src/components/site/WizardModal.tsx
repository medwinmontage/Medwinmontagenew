'use client';
import { useEffect, useState } from 'react';
import { useModals } from './ModalContext';
import Icon from './Icon';
import Modal from '@/components/ui/Modal';
import { Field, FormError, SuccessMark } from '@/components/ui/Field';
import { openWhatsApp, buildServiceWhatsAppMessage } from '@/lib/whatsapp';

type Service = { id: string; icon: string; title: string; desc: string; items: string[] };

export default function WizardModal({ services, whatsappNumber }: { services: Service[]; whatsappNumber?: string }) {
  const { state, closeWizard } = useModals();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [contact, setContact] = useState({ name: '', phone: '', email: '', location: '', company: '', gst: '' });
  const [result, setResult] = useState<{ ref: string; message: string | null } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  useEffect(() => {
    if (state.wizard) {
      if (state.wizardPreset) { setCategories([state.wizardPreset]); setStep(2); }
      else { setCategories([]); setStep(1); }
      setContact({ name: '', phone: '', email: '', location: '', company: '', gst: '' });
      setResult(null); setError('');
    }
  }, [state.wizard, state.wizardPreset]);

  function toggleCategory(id: string) {
    setCategories((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  async function next() {
    setError('');
    if (step === 1 && categories.length === 0) { setError('Pick at least one category to continue'); return; }
    if (step === 2) {
      if (!contact.name || !contact.phone || !contact.email || !contact.location) { setError('Please fill all required fields'); return; }
      if (loading) return;
      setLoading(true);
      const categoryNames = categories.map((id) => services.find((s) => s.id === id)?.title || id);
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: state.wizardMode,
          categories: categoryNames,
          itemsJson: {}, detailsJson: {}, ...contact,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      setResult({ ref: data.ref, message: data.message });
      const message = buildServiceWhatsAppMessage(contact, categoryNames, data.ref);
      setLastMessage(message);
      openWhatsApp(message, whatsappNumber);
      return;
    }
    setStep((s) => s + 1);
  }
  function back() { if (step > 1) setStep((s) => s - 1); }
  function close() { closeWizard(); }

  const activeServices = services; // categories are chosen from all active services in step 1

  const title = result
    ? (state.wizardMode === 'offer' ? "You're on the waitlist" : 'Request submitted')
    : ['Select your service', 'Contact details'][step - 1];

  return (
    <Modal open={state.wizard} onClose={close} title={title} size="lg">
      {result ? (
        <div className="text-center py-3">
          <SuccessMark />
          <h4 className="font-display font-bold text-2xl mb-2">{state.wizardMode === 'offer' ? "You're on the waitlist" : 'Request received'}</h4>
          <p className="text-sm text-muted mb-4">
            {result.message || "We'll review your selections and send a quotation shortly."}
          </p>
          <span className="badge badge-neutral">Reference: {result.ref}</span>
          <p className="text-xs text-muted mt-6 mb-2">Opening WhatsApp to confirm your request…</p>
          <button type="button" onClick={() => openWhatsApp(lastMessage, whatsappNumber)} className="btn btn-secondary btn-sm"><Icon name="chat" /> Open WhatsApp manually</button>
          <button type="button" onClick={close} className="btn btn-primary w-full mt-5">Done</button>
        </div>
      ) : (
        <form noValidate onSubmit={(e) => { e.preventDefault(); next(); }}>
          <div className="flex items-center gap-2 mb-5" aria-hidden>
            {[1, 2].map((n) => <span key={n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= step ? 'bg-accent' : 'bg-line-strong'}`} />)}
          </div>
          <p className="sr-only" role="status">Step {step} of 2</p>
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeServices.map((s) => {
                const picked = categories.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleCategory(s.id)}
                    aria-pressed={picked}
                    className={`relative rounded-xl border p-4 text-left flex gap-3 transition-all duration-200 ${picked ? 'border-accent bg-accent/10 shadow-glow-sm' : 'border-line-strong hover:border-accent/60'}`}
                  >
                    <Icon name={s.icon} className="w-5 h-5 text-accent-ink flex-shrink-0 mt-0.5" />
                    <span className="pr-5"><span className="block text-sm font-bold mb-1">{s.title}</span><span className="block text-xs text-muted">{s.desc}</span></span>
                    {picked && <Icon name="check" className="absolute top-3 right-3 w-4 h-4 text-accent-ink" />}
                  </button>
                );
              })}
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
                <Field label="Full name *"><input className="input" autoComplete="name" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} /></Field>
                <Field label="Phone *"><input type="tel" className="input" autoComplete="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} /></Field>
              </div>
              <Field label="Email *"><input type="email" className="input" autoComplete="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} /></Field>
              <Field label="Location *"><input className="input" value={contact.location} onChange={(e) => setContact((c) => ({ ...c, location: e.target.value }))} /></Field>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
                <Field label="Company (optional)"><input className="input" autoComplete="organization" value={contact.company} onChange={(e) => setContact((c) => ({ ...c, company: e.target.value }))} /></Field>
                <Field label="GST (optional)"><input className="input" value={contact.gst} onChange={(e) => setContact((c) => ({ ...c, gst: e.target.value }))} /></Field>
              </div>
            </div>
          )}
          <FormError className="mt-4">{error}</FormError>
          <div className="flex justify-between gap-3 mt-6">
            <button type="button" onClick={back} className={`btn btn-ghost ${step === 1 ? 'invisible' : ''}`}>Back</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Submitting…' : step === 2 ? 'Submit Request' : 'Continue'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
