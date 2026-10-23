'use client';
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center text-center px-6 overflow-hidden">
      <div className="hero-bg" aria-hidden><div className="light light-a" /></div>
      <div className="relative z-10 rise" role="alert">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-4">Something went wrong.</h1>
        <p className="text-muted mb-8">We&rsquo;ve logged the issue — please try again, or head back to the homepage.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button type="button" onClick={reset} className="btn btn-primary btn-lg">Try again</button>
          <a href="/" className="btn btn-secondary btn-lg">Homepage</a>
        </div>
      </div>
    </main>
  );
}
