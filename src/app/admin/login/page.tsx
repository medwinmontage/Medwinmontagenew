'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/site/ThemeToggle';
import { Field, FormError } from '@/components/ui/Field';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_MARK } from '@/lib/brand';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-5 overflow-hidden">
      <div className="hero-bg" aria-hidden><div className="light light-a" /></div>
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      <form onSubmit={submit} className="relative z-10 card card-glass p-7 sm:p-8 w-full max-w-sm rise">
        <div className="flex flex-col items-center text-center mb-7">
          <img src={BRAND_MARK} alt="" width={52} height={52} className="h-[52px] w-[52px] mb-3" />
          <div className="font-display font-extrabold tracking-tight">{BRAND_NAME}</div>
          <div className="text-xs text-muted mt-0.5">{BRAND_TAGLINE}</div>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-center mb-6">Admin Login</h1>
        <div className="flex flex-col gap-4">
          <Field label="Username"><input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></Field>
          <Field label="Password"><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
          <FormError>{error}</FormError>
          <button type="submit" disabled={loading} className="btn btn-primary btn-cta btn-lg w-full">
            {loading ? 'Signing in…' : 'Log In'}
          </button>
        </div>
        <p className="hint mt-5">
          First time? Run <code>npm run db:seed</code> to create the seeded admin account
          (username/password come from <code>.env</code> — change the password immediately after logging in).
        </p>
      </form>
    </main>
  );
}
