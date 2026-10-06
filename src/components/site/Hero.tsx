'use client';
import { CSSProperties, ReactNode } from 'react';
import { useModals } from './ModalContext';
import Icon from './Icon';

type Stat = { value: string; label: string };

const step = (i: number) => ({ '--i': i } as CSSProperties);

/**
 * Colours part of the headline orange. The headline is edited in
 * Admin → Hero, so the emphasis is worked out from the text:
 *  - words wrapped in *asterisks* are highlighted, if there are any;
 *  - otherwise the last sentence is (when there are several);
 *  - otherwise the last two words are.
 */
function renderHeadline(headline: string): ReactNode {
  const hi = (text: string, key: number) => <span key={key} className="text-accent-glow">{text}</span>;
  if (/\*[^*]+\*/.test(headline)) {
    return headline.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? hi(part, i) : part));
  }
  const sentences = headline.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 1 && sentences.join('').length === headline.trim().length) {
    const last = sentences[sentences.length - 1];
    return [sentences.slice(0, -1).join(''), hi(last, 1)];
  }
  const words = headline.trim().split(/\s+/);
  if (words.length < 4) return headline;
  return [words.slice(0, -2).join(' ') + ' ', hi(words.slice(-2).join(' '), 1)];
}

// Decorative: the stages of a job laid out like tracks in an editing timeline.
const LANES: [string, [number, number, '' | 'is-hot' | 'is-warm'][]][] = [
  ['Shoot', [[2, 24, 'is-warm'], [31, 13, '']]],
  ['Edit', [[17, 35, 'is-hot'], [57, 13, '']]],
  ['Design', [[39, 21, 'is-warm'], [65, 11, '']]],
  ['Web', [[49, 31, ''], [84, 13, 'is-warm']]],
  ['Promote', [[69, 28, 'is-hot']]],
];

export default function Hero({ eyebrow, headline, sub, stats }: { eyebrow: string; headline: string; sub: string; stats: Stat[] }) {
  const { openBooking, openWizard } = useModals();
  return (
    <section id="home" className="relative pt-32 pb-16 md:pt-44 md:pb-28">
      <div className="hero-bg" aria-hidden>
        <div className="light light-a" />
        <div className="light light-b" />
      </div>
      <div className="container-x relative z-10 grid lg:grid-cols-[1.1fr_.9fr] gap-12 lg:gap-14 items-center">
        <div>
          <div className="eyebrow mb-5 rise" style={step(0)}>{eyebrow}</div>
          <h1 className="font-display font-extrabold text-[2.5rem] sm:text-6xl lg:text-[4.1rem] leading-[1.03] tracking-[-0.035em] mb-6 rise" style={step(1)}>
            {renderHeadline(headline)}
          </h1>
          <p className="text-[17px] md:text-lg text-muted max-w-xl mb-9 rise" style={step(2)}>{sub}</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3.5 mb-8 rise" style={step(3)}>
            <button type="button" onClick={openBooking} className="btn btn-primary btn-cta btn-lg">Book For Event</button>
            <button type="button" onClick={() => openWizard()} className="btn btn-secondary btn-lg">Book Our Services</button>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm rise" style={step(4)}>
            <a href="#portfolio" className="link-accent">Watch Portfolio <Icon name="arrow-up-right" /></a>
            <a href="#contact" className="link-accent">Get Free Consultation <Icon name="arrow-up-right" /></a>
          </div>
        </div>

        <div className="card card-glass p-5 sm:p-7 rise" style={step(3)}>
          <div className="tl mb-6" aria-hidden>
            {LANES.map(([name, clips]) => (
              <div key={name} className="tl-track">
                <span className="text-[11.5px] font-semibold text-muted">{name}</span>
                <div className="tl-lane">
                  {clips.map(([left, width, tone], i) => (
                    <span key={i} className={`tl-clip ${tone}`} style={{ left: `${left}%`, width: `${width}%` }} />
                  ))}
                </div>
              </div>
            ))}
            <div className="tl-playhead" />
          </div>
          <h2 className="font-display font-bold text-xl mb-2">Why brands work with us</h2>
          <p className="text-sm text-muted mb-6">A single point of contact for every stage — shoot, edit, post and grow.</p>
          {stats.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-5 gap-y-5 pt-6 border-t border-line">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="text-xs text-muted mt-0.5">{s.label}</dt>
                  <dd className="font-display font-extrabold text-[1.75rem] leading-none text-accent-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
