import Reveal from '@/components/ui/Reveal';
import Icon from './Icon';

const ROLES = ['Videographers', 'Photographers', 'Video producers', 'Graphic designers', 'Web developers', 'Social media & ads managers'];

export default function CrewSection() {
  return (
    <section id="join-crew" className="section">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[24px] border border-line bg-[#0A0A0A] text-white px-6 py-10 sm:px-12 sm:py-14 shadow-lift">
            <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(70% 120% at 100% 0%, rgba(255,106,0,.32), transparent 60%), radial-gradient(60% 100% at 0% 100%, rgba(255,138,0,.14), transparent 60%)' }} />
            <div className="relative grid lg:grid-cols-[1.2fr_.8fr] gap-8 lg:gap-12 items-center">
              <div>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-[2.75rem] mb-4">Join as Crew in Medwin Montage</h2>
                <p className="text-[#C6C6C6] text-base md:text-[17px] leading-relaxed max-w-[52ch] mb-7">
                  We work with freelancers on shoots, edits, design, websites and campaigns. Freshers are welcome — create a free crew account, tell us what you do and show us something you have made. We will update you right on the site.
                </p>
                <a href="/join-as-crew" className="btn btn-primary btn-cta btn-lg">Apply to Join Our Crew <Icon name="arrow-right" /></a>
              </div>
              <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5 text-sm">
                {ROLES.map((r) => (
                  <li key={r} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                    <Icon name="check" className="w-4 h-4 flex-shrink-0 text-[#FF8A2B]" />{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
