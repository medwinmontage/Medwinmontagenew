import Icon from '@/components/site/Icon';

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex items-center justify-center text-center px-6 overflow-hidden">
      <div className="hero-bg" aria-hidden><div className="light light-a" /></div>
      <div className="relative z-10 rise">
        <p className="font-display font-extrabold text-7xl sm:text-8xl text-accent-glow leading-none mb-5">404</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-4">This page doesn&rsquo;t exist.</h1>
        <p className="text-muted mb-8">The page you&rsquo;re looking for may have been moved or removed.</p>
        <a href="/" className="btn btn-primary btn-cta btn-lg">Back to homepage <Icon name="arrow-right" /></a>
      </div>
    </main>
  );
}
