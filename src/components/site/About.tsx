import Reveal from '@/components/ui/Reveal';
import Icon from './Icon';

const POINTS = [
  ['users', 'One team, every step.', 'Shoot, edit and publish handled by people who already know your brand.'],
  ['share', 'Built for every platform.', "Reels, YouTube, ads and websites cut to fit where they'll actually run."],
  ['receipt', 'Transparent from quote to delivery.', 'Clear pricing, a tracked booking status and a real person to talk to.'],
] as const;

export default function About() {
  return (
    <section id="about" className="section section-alt">
      <div className="container-x grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <Reveal>
          <div className="eyebrow mb-4">About Medwin Montage</div>
          <h2 className="h-section mb-6">Freelance craft, agency-level delivery.</h2>
          <p className="lede max-w-[58ch]">
            Medwin Montage is a freelance creative practice built around one idea: every business — from a wedding to a
            product launch — deserves footage and content that actually gets watched. We plan, shoot, edit and manage
            the rollout, so you get a finished result, not a folder of raw files.
          </p>
        </Reveal>
        <ul className="flex flex-col gap-4">
          {POINTS.map(([icon, title, body], i) => (
            <li key={title}>
              <Reveal delay={i * 90}>
                <div className="card card-hover p-5 flex gap-4 items-start">
                  <span className="icon-tile flex-shrink-0"><Icon name={icon} /></span>
                  <div>
                    <h3 className="font-display font-bold text-[17px] mb-1">{title}</h3>
                    <p className="text-sm text-muted">{body}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
