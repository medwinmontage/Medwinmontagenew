import Reveal from '@/components/ui/Reveal';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_MARK } from '@/lib/brand';

export default function Who({ headline, text }: { headline: string; text: string }) {
  const paragraphs = text.split('\n\n').filter(Boolean);
  return (
    <section id="who" className="section">
      <div className="container-x grid md:grid-cols-[.8fr_1.2fr] gap-10 md:gap-16 items-center">
        <Reveal>
          <div className="relative overflow-hidden rounded-[20px] border border-line aspect-[16/10] md:aspect-[4/5] flex flex-col items-center justify-center gap-5 bg-[#0A0A0A] glow-backdrop shadow-lift">
            <img src={BRAND_MARK} alt="" className="w-2/5 md:w-1/2 drop-shadow-[0_0_34px_rgba(255,106,0,0.45)]" />
            <div className="text-center px-4">
              <div className="font-display font-extrabold text-white tracking-tight">{BRAND_NAME}</div>
              <div className="text-xs text-[#C6C6C6] mt-1">{BRAND_TAGLINE}</div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="eyebrow mb-4">Who</div>
          <h2 className="h-section mb-6">{headline}</h2>
          <div className="flex flex-col gap-4">
            {paragraphs.map((p, i) => <p key={i} className="lede max-w-[62ch]">{p}</p>)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
