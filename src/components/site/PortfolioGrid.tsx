'use client';
import { useState } from 'react';
import Icon from './Icon';
import Reveal from '@/components/ui/Reveal';

type Item = { id: string; category: string; tag: string; title: string; client?: string | null; completedAt?: string | null; videoUrl?: string | null; thumbnailUrl?: string | null };

// Placeholder backdrops for items without a thumbnail: black with an orange light from a different corner each time.
const BACKDROPS = [
  'radial-gradient(120% 90% at 0% 0%, rgba(255,106,0,.34), transparent 60%), #0A0A0A',
  'radial-gradient(110% 90% at 100% 10%, rgba(255,138,0,.26), transparent 62%), #111111',
  'radial-gradient(120% 100% at 50% 0%, rgba(255,160,51,.24), transparent 58%), #0A0A0A',
  'radial-gradient(120% 90% at 100% 100%, rgba(255,106,0,.30), transparent 60%), #151515',
  'radial-gradient(110% 100% at 0% 60%, rgba(255,179,71,.20), transparent 60%), #0A0A0A',
  'radial-gradient(130% 90% at 80% 0%, rgba(255,122,0,.30), transparent 60%), #111111',
];

export default function PortfolioGrid({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('All');
  if (items.length === 0) return null;
  const cats = ['All', ...Array.from(new Set(items.map((i) => i.category)))];
  const visible = filter === 'All' ? items : items.filter((i) => i.category === filter);

  return (
    <section id="portfolio" className="section section-alt">
      <div className="container-x">
        <Reveal className="mb-8">
          <div className="eyebrow mb-4">Selected work</div>
          <h2 className="h-section">A sample of recent projects.</h2>
        </Reveal>
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter projects by category">
          {cats.map((c) => (
            <button key={c} type="button" onClick={() => setFilter(c)} aria-pressed={filter === c} className="chip">{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((p, i) => {
            const card = (
              <div className="group card card-hover relative aspect-[16/11] sm:aspect-[4/5] overflow-hidden">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt="" loading="lazy" className="img-zoom absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="img-zoom absolute inset-0" style={{ background: BACKDROPS[i % BACKDROPS.length] }} />
                )}
                {p.videoUrl && (
                  <span className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/55 border border-white/20 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-accent group-hover:text-on-accent group-hover:border-accent group-hover:shadow-glow-md">
                    <Icon name="play" className="w-4 h-4 translate-x-px" />
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <span className="text-xs font-bold text-[#FFB347] mb-1.5">{p.tag}</span>
                  <h3 className="font-display font-bold text-white text-xl">{p.title}</h3>
                  {p.client && <span className="text-xs text-[#C6C6C6] mt-1.5">{p.client}{p.completedAt ? `, ${p.completedAt}` : ''}</span>}
                </div>
              </div>
            );
            return (
              <Reveal key={p.id} delay={(i % 3) * 80}>
                {p.videoUrl ? (
                  <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="block rounded-2xl" aria-label={`${p.title} — watch video (opens in a new tab)`}>{card}</a>
                ) : card}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
