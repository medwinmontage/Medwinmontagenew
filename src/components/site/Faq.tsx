'use client';
import { useState } from 'react';
import Icon from './Icon';
import Reveal from '@/components/ui/Reveal';

type F = { id: string; question: string; answer: string };

export default function Faq({ items }: { items: F[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (items.length === 0) return null;

  return (
    <section id="faq" className="section section-alt">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        <Reveal className="text-center mb-10">
          <div className="eyebrow mb-4">FAQ</div>
          <h2 className="h-section">Good to know before you book.</h2>
        </Reveal>
        <Reveal>
          <div className="flex flex-col gap-3">
            {items.map((f) => {
              const isOpen = open === f.id;
              return (
                <div key={f.id} className={`card transition-colors duration-200 ${isOpen ? '!border-accent/60' : 'hover:border-line-strong'}`}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : f.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${f.id}`}
                      className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 font-sans font-bold text-[15.5px] tracking-normal leading-snug rounded-2xl"
                    >
                      <span>{f.question}</span>
                      <Icon name="plus" className={`w-5 h-5 flex-shrink-0 text-accent-ink transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                    </button>
                  </h3>
                  <div id={`faq-${f.id}`} className="faq-body" data-open={isOpen}>
                    <div><p className="px-5 pb-5 text-sm text-muted leading-relaxed">{f.answer}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
