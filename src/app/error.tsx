'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // The server-side cause is in Vercel → Logs; the digest below is how to find the matching line.
  useEffect(() => { console.error('[app error]', error?.digest || '', error?.message); }, [error]);
  return (
    <main className="relative min-h-screen flex items-center justify-center text-center px-6 overflow-hidden">
      <div className="hero-bg" aria-hidden><div className="light light-a" /></div>
      <div className="relative z-10 rise" role="alert">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-4">Something went wrong.</h1>
        <p className="text-muted mb-8">Please try again, or head back to the homepage.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={reset} className="btn btn-primary btn-lg">Try again</button>
          <a href="/" className="btn btn-secondary btn-lg">Homepage</a>
        </div>
        {error?.digest && <p className="mt-8 text-xs text-muted">Reference: {error.digest}</p>}
        <p className="mt-2 text-xs text-muted">Site owner: <a className="underline" href="/api/health">/api/health</a> shows what is missing.</p>
      </div>
    </main>
  );
}
