'use client';
import { useEffect, useState } from 'react';
import { useModals } from './ModalContext';
import Modal from '@/components/ui/Modal';
import AuthForms, { Me } from './AuthForms';
import Icon from './Icon';

export default function AccountModal() {
  const { state, closeAccount } = useModals();
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!state.account) return;
    fetch('/api/auth/me').then((r) => r.json())
      .then((d) => setMe(d.customer ? { id: d.customer.sub, name: d.customer.name, email: d.customer.email } : null))
      .catch(() => setMe(null))
      .finally(() => setChecked(true));
  }, [state.account]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'customer' }) });
    setMe(null);
    window.dispatchEvent(new Event('mm-auth'));
  }

  return (
    <Modal open={state.account} onClose={closeAccount} title="My Account" size="sm">
      {!checked ? (
        <p className="text-sm text-muted" role="status">Loading…</p>
      ) : me ? (
        <div>
          <div className="flex items-center gap-3.5 mb-6">
            <span className="icon-tile !rounded-full font-display font-extrabold text-lg" aria-hidden>{me.name.trim().charAt(0).toUpperCase() || '?'}</span>
            <div className="min-w-0">
              <div className="font-bold text-[15px] truncate">{me.name}</div>
              <div className="text-muted text-[13px] truncate">{me.email}</div>
            </div>
          </div>
          <a href="/account" className="btn btn-primary w-full mb-3">Open my dashboard <Icon name="arrow-right" /></a>
          <p className="hint text-center mb-4">Profile, bookings, service history, quotes and feedback.</p>
          <button type="button" onClick={logout} className="btn btn-secondary w-full">Log Out</button>
        </div>
      ) : (
        <AuthForms onAuthed={setMe} />
      )}
    </Modal>
  );
}
