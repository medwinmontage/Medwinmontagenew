'use client';
import Icon from './Icon';
import Reveal from '@/components/ui/Reveal';
import { useModals } from './ModalContext';

type Service = { id: string; icon: string; title: string; desc: string };

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

export default function ServicesGrid({ services, areaLine }: { services: Service[]; areaLine?: string }) {
  const { openWizard } = useModals();
  if (services.length === 0) return null;
  // Keep the last row full where possible: 4 across for 4/8/12 services, otherwise 3.
  const cols = services.length % 4 === 0 ? 4 : 3;
  const count = WORDS[services.length] ?? String(services.length);

  return (
    <section id="services" className="section">
      <div className="container-x">
        <Reveal className="mb-12">
          <div className="eyebrow mb-4">What we do</div>
          <h2 className="h-section">{count} {services.length === 1 ? 'service' : 'services'}. One point of contact.</h2>
          {areaLine && <p className="lede mt-4 max-w-[62ch]">{areaLine}</p>}
        </Reveal>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${cols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {services.map((s, i) => (
            <Reveal key={s.id} delay={(i % cols) * 80} className="h-full">
              <button
                type="button"
                onClick={() => openWizard(s.id)}
                className="group card card-hover w-full h-full p-6 text-left flex flex-col gap-3.5"
              >
                <span className="icon-tile"><Icon name={s.icon} /></span>
                <h3 className="font-display font-bold text-lg">{s.title}</h3>
                <p className="text-sm text-muted flex-1">{s.desc}</p>
                <span className="text-[13px] font-bold text-accent-ink inline-flex items-center gap-1.5 mt-1">
                  Explore features &amp; edited videos
                  <Icon name="arrow-right" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
