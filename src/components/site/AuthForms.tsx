'use client';
import { useState } from 'react';
import { Field, FormError } from '@/components/ui/Field';

export type Me = { id: string; name: string; email: string };

/** Log in / register for customers (header dialog, /account) and for crew (/join-as-crew, /crew). */
export default function AuthForms({ onAuthed, kind = 'customer' }: { onAuthed: (me: Me) => void; kind?: 'customer' | 'crew' }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '', password2: '' });

  async function post(url: string, body: unknown, fallback: string) {
    setError(''); setLoading(true);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || fallback); return null; }
      window.dispatchEvent(new Event('mm-auth')); // lets the header bell appear without a reload
      return data as { id: string; name: string };
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }
  async function login() {
    if (loading) return;
    const data = await post(`/api/auth/${kind}/login`, loginForm, 'Login failed');
    if (data) onAuthed({ id: data.id, name: data.name, email: loginForm.identifier });
  }
  async function register() {
    if (loading) return;
    if (regForm.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (regForm.password !== regForm.password2) { setError('Passwords do not match.'); return; }
    const data = await post(`/api/auth/${kind}/register`, { name: regForm.name, email: regForm.email, phone: regForm.phone, password: regForm.password }, 'Registration failed');
    if (data) onAuthed({ id: data.id, name: data.name, email: regForm.email });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-xl border border-line bg-paper-2" role="tablist" aria-label="Account">
        {(['login', 'register'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setError(''); }}
            className={`py-2.5 rounded-[9px] text-sm font-bold transition-all duration-200 ${tab === t ? 'bg-accent text-on-accent shadow-glow-sm' : 'text-muted hover:text-ink'}`}>
            {t === 'login' ? 'Log In' : 'Register'}
          </button>
        ))}
      </div>
      {tab === 'login' ? (
        <form noValidate onSubmit={(e) => { e.preventDefault(); login(); }} className="flex flex-col gap-4">
          <Field label="Email or phone"><input className="input" autoComplete="username" value={loginForm.identifier} onChange={(e) => setLoginForm((f) => ({ ...f, identifier: e.target.value }))} /></Field>
          <Field label="Password"><input type="password" className="input" autoComplete="current-password" value={loginForm.password} onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} /></Field>
          <FormError>{error}</FormError>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">{loading ? 'Logging in…' : 'Log In'}</button>
        </form>
      ) : (
        <form noValidate onSubmit={(e) => { e.preventDefault(); register(); }} className="flex flex-col gap-4">
          <Field label="Full name *"><input className="input" autoComplete="name" value={regForm.name} onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Email *"><input type="email" className="input" autoComplete="email" value={regForm.email} onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Phone *"><input type="tel" className="input" autoComplete="tel" value={regForm.phone} onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
            <Field label="Password *" hint="At least 8 characters"><input type="password" className="input" autoComplete="new-password" value={regForm.password} onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))} /></Field>
            <Field label="Confirm password *"><input type="password" className="input" autoComplete="new-password" value={regForm.password2} onChange={(e) => setRegForm((f) => ({ ...f, password2: e.target.value }))} /></Field>
          </div>
          <FormError>{error}</FormError>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">{loading ? 'Creating account…' : kind === 'crew' ? 'Create Crew Account' : 'Create Account'}</button>
        </form>
      )}
    </>
  );
}
