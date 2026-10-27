'use client';
import { useModals } from './ModalContext';
import Icon from './Icon';
import Reveal from '@/components/ui/Reveal';

type Pkg = { id: string; name: string; desc: string; features: string[]; popular: boolean };

export default function PackagesGrid({ packages }: { packages: Pkg[] }) {
  const { openQuote } = useModals();
  if (packages.length === 0) return null;

  return (
    <section id="packages" className="section">
      <div className="container-x">
        <Reveal className="mb-12">
          <div className="eyebrow mb-4">Packages &amp; pricing</div>
          <h2 className="h-section">Monthly packages, quoted for your brand.</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80} className="h-full">
              <div className={`card card-hover relative h-full p-7 flex flex-col gap-4 ${p.popular ? '!border-accent shadow-glow-md' : ''}`}>
                {p.popular && <span className="badge badge-solid absolute -top-3 right-5">Popular</span>}
                <h3 className="font-display font-bold text-2xl">{p.name}</h3>
                <p className="text-sm text-muted">{p.desc}</p>
                <ul className="text-sm flex flex-col gap-2.5 mb-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Icon name="check" className="w-4 h-4 mt-1 flex-shrink-0 text-accent-ink" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={openQuote} className={`btn mt-auto ${p.popular ? 'btn-primary' : 'btn-secondary'}`}>Request Quote</button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
