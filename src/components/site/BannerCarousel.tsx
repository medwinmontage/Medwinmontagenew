'use client';
import { useEffect, useMemo, useState } from 'react';
import { bannerState, isSafeExternalUrl, isSafeInternalPath } from '@/lib/links';

type Banner = {
  id: string; name: string; imageUrl: string; mobileImageUrl?: string; altText: string; linkType: string; linkUrl: string;
  enabled: boolean; startAt: string | null; endAt: string | null; timerEnabled: boolean;
};

function Countdown({ endAt, now }: { endAt: string; now: number }) {
  const diff = Math.max(0, new Date(endAt).getTime() - now);
  const parts = [
    ['d', Math.floor(diff / 86400000)], ['h', Math.floor((diff % 86400000) / 3600000)],
    ['m', Math.floor((diff % 3600000) / 60000)], ['s', Math.floor((diff % 60000) / 1000)],
  ] as const;
  return (
    <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 flex items-center gap-1.5 rounded-xl bg-black/70 backdrop-blur px-2.5 py-2 text-white" role="timer"
      aria-label={`Ends in ${parts[0][1]} days ${parts[1][1]} hours ${parts[2][1]} minutes`}>
      <span className="text-[11px] font-bold text-[#FFB347] mr-1 hidden min-[380px]:inline">Ends in</span>
      {parts.map(([unit, value]) => (
        <span key={unit} className="min-w-[38px] rounded-lg bg-white/10 px-1.5 py-1 text-center">
          <b className="font-display text-base sm:text-lg tabular-nums leading-none">{String(value).padStart(2, '0')}</b>
          <span className="text-[10px] ml-0.5 opacity-80">{unit}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Home-page banners. The server only sends banners that are live, and this
 * component re-checks the schedule every second so a banner appears at its
 * start time and disappears the moment its end time (or timer) is reached.
 */
export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [now, setNow] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const scheduled = banners.some((b) => b.startAt || b.endAt);
  useEffect(() => {
    setNow(Date.now());
    if (!scheduled) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [scheduled]);

  // Before hydration `now` is null: trust the server's list so nothing flashes.
  const live = useMemo(() => (now === null ? banners : banners.filter((b) => bannerState(b, now) === 'ACTIVE')), [banners, now]);

  useEffect(() => {
    if (live.length < 2 || paused) return;
    const t = setInterval(() => setI((v) => v + 1), 5000);
    return () => clearInterval(t);
  }, [live.length, paused]);

  if (live.length === 0) return null;
  const index = i % live.length;
  const b = live[index];
  const alt = b.altText || b.name || 'Medwin Montage banner';
  // Phones use the optional phone artwork (screens under 640px); everyone else the main image.
  const pic = (cls: string, a: string) => (
    <picture>
      {b.mobileImageUrl && <source media="(max-width: 639px)" srcSet={b.mobileImageUrl} />}
      <img src={b.imageUrl} alt={a} decoding="async" draggable={false} className={cls} />
    </picture>
  );
  // The WHOLE image is always visible (object-contain): nothing is cropped on any screen shape.
  // The frame behind it is the same picture, enlarged and blurred, so a banner whose shape
  // differs from the frame has soft colour at its sides instead of empty bars.
  const img = (
    <div key={b.id} className="relative w-full h-full swap-in">
      <div aria-hidden className="absolute inset-0 overflow-hidden [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:scale-125 [&_img]:blur-2xl [&_img]:opacity-70">{pic('', '')}</div>
      <div className="absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-contain">{pic('', alt)}</div>
    </div>
  );
  const hasPhoneArt = live.some((x) => x.mobileImageUrl);
  const external = b.linkType !== 'internal';
  const href = b.linkUrl && (external ? isSafeExternalUrl(b.linkUrl) : isSafeInternalPath(b.linkUrl)) ? b.linkUrl : null;

  return (
    <section aria-label="Announcements" className="container-x pb-14 md:pb-20">
      <div
        className={`relative overflow-hidden rounded-2xl border border-line bg-paper-2 shadow-lift max-h-[80svh] ${hasPhoneArt ? 'aspect-[4/5]' : 'aspect-[16/10]'} sm:aspect-[21/9]`}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      >
        {href ? (
          <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="block w-full h-full" aria-label={b.altText || b.name || 'Open banner link'}>{img}</a>
        ) : img}
        {b.timerEnabled && b.endAt && now !== null && <Countdown endAt={b.endAt} now={now} />}
        {live.length > 1 && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex gap-1.5 rounded-full bg-black/55 px-2.5 py-2">
            {live.map((x, idx) => (
              <button key={x.id} type="button" onClick={() => setI(idx)} aria-label={`Show banner ${idx + 1} of ${live.length}`} aria-current={idx === index}
                className={`h-1.5 rounded-full transition-all ${idx === index ? 'w-5 bg-accent' : 'w-1.5 bg-white/70 hover:bg-white'}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
