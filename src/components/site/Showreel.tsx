'use client';
import Reveal from '@/components/ui/Reveal';
import AutoVideo from './AutoVideo';
import Icon from './Icon';
import { parseVideoUrl } from '@/lib/media';

export type ShowreelVideo = { id: string; title: string; caption: string; source: string; url: string; posterUrl: string };

/** Autoplaying (muted, looped) videos managed in Admin → Videos. Not rendered when there are none. */
export default function Showreel({ videos }: { videos: ShowreelVideo[] }) {
  const playable = videos.map((v) => ({ v, parsed: parseVideoUrl(v.url) })).filter((x) => x.parsed);
  if (playable.length === 0) return null;
  const single = playable.length === 1;

  return (
    <section id="showreel" className="section" aria-labelledby="showreel-title">
      <div className="container-x">
        <Reveal className="mb-8">
          <div className="eyebrow mb-4">Showreel</div>
          <h2 id="showreel-title" className="h-section">See our work in motion.</h2>
        </Reveal>
        <div className={single ? 'max-w-4xl mx-auto' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'}>
          {playable.map(({ v, parsed }, i) => (
            <Reveal key={v.id} delay={(i % 3) * 80}>
              <figure className="card overflow-hidden">
                <AutoVideo video={parsed!} poster={v.posterUrl || undefined} title={v.title} className="aspect-video w-full" />
                <figcaption className="p-4">
                  <h3 className="font-display font-bold text-base break-words">{v.title}</h3>
                  {v.caption && <p className="text-sm text-muted mt-1 break-words">{v.caption}</p>}
                  {parsed!.kind !== 'file' && (
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-ink mt-2.5">
                      Watch with sound <Icon name="external" className="w-3.5 h-3.5" /><span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
