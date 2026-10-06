'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import Reveal from '@/components/ui/Reveal';

type T = { id: string; quote: string; name: string; role: string; rating?: number };

export default function Testimonials({ items }: { items: T[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (items.length < 2 || paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length, paused]);
  if (items.length === 0) return null;
  const t = items[i % items.length];

  return (
    <section id="testimonials" className="section">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        <Reveal>
          <div className="text-center mb-8"><div className="eyebrow">Client words</div></div>
          <figure
            className="card relative p-7 sm:p-10 text-center overflow-hidden"
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
          >
            <Icon name="quote" className="w-9 h-9 mx-auto mb-4 text-accent-ink opacity-80" />
            <div className="flex justify-center gap-1 mb-5 text-accent" role="img" aria-label={`Rated ${t.rating ?? 5} out of 5`}>
              {[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" className={`w-4 h-4 ${n <= (t.rating ?? 5) ? 'fill-current' : 'opacity-40'}`} />)}
            </div>
            <div key={t.id} className="swap-in" aria-live="polite">
              <blockquote className="font-display font-semibold text-xl sm:text-2xl md:text-[1.7rem] leading-snug tracking-tight mb-6">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption>
                <div className="font-extrabold text-sm">{t.name}</div>
                <div className="text-xs text-muted mt-0.5">{t.role}</div>
              </figcaption>
            </div>
            {items.length > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setI(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === i ? 'w-7 bg-accent shadow-glow-sm' : 'w-2 bg-line-strong hover:bg-accent/60'}`}
                    aria-label={`Show testimonial ${idx + 1}`}
                    aria-current={idx === i}
                  />
                ))}
              </div>
            )}
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
