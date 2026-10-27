'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { ParsedVideo, embedUrl, youtubePoster } from '@/lib/media';

/**
 * A video that starts by itself — within what browsers allow.
 *
 * Browsers only autoplay video that is MUTED (and `playsInline` on iPhone), so it
 * starts silent, loops, and offers an unmute button. To stay kind to phones and
 * visitors:
 *   • it only loads and plays while it is on screen, and pauses when scrolled away;
 *   • with "reduce motion" or Data Saver on, it shows its poster and waits for a tap;
 *   • there is always a pause button, and unmute for uploaded files.
 * YouTube / Vimeo play through their own embeds (also muted + looped) and are removed
 * from the page when off screen, which is how they get paused.
 */
export default function AutoVideo({
  video, poster, title, cover = false, controls = true, className = '',
}: {
  video: ParsedVideo; poster?: string; title: string; cover?: boolean; controls?: boolean; className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [calm, setCalm] = useState(false);          // reduced motion or data saver
  const [choice, setChoice] = useState<boolean | null>(null); // what the visitor asked for, if anything
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);       // the file is only requested once it has been on screen
  const [blocked, setBlocked] = useState(false);     // the browser refused to autoplay
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCalm(rm.matches || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    sync(); rm.addEventListener('change', sync);
    return () => rm.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const node = box.current;
    if (!node || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const wantPlay = inView && (choice ?? !calm);
  useEffect(() => { if (wantPlay) setLoaded(true); }, [wantPlay]);

  // Drive the <video> element (files only).
  useEffect(() => {
    const v = el.current;
    if (!v || video.kind !== 'file') return;
    v.muted = muted;
    if (wantPlay && loaded) {
      v.play().then(() => setBlocked(false)).catch(() => setBlocked(true)); // e.g. iOS Low Power Mode
    } else {
      v.pause();
    }
  }, [wantPlay, loaded, muted, video.kind]);

  const toggle = useCallback(() => {
    const next = !(choice ?? !calm);
    setChoice(next);
    setLoaded(true);
    // Call play() inside the tap itself — Safari only honours it there.
    if (next && el.current) el.current.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  }, [choice, calm]);

  const playing = wantPlay && !blocked && !failed;
  const posterSrc = poster || (video.kind === 'youtube' ? youtubePoster(video.id) : '');
  const embed = video.kind === 'file' ? null : embedUrl(video);
  const fill = 'absolute inset-0 w-full h-full';

  return (
    <div ref={box} className={`relative overflow-hidden bg-black ${className}`} style={{ containerType: 'size' }}>
      {video.kind === 'file' ? (
        <video
          ref={el} src={loaded ? video.src : undefined} poster={posterSrc || undefined}
          muted loop playsInline preload="none" aria-label={title} onError={() => setFailed(true)}
          className={`${fill} ${cover ? 'object-cover' : 'object-contain'}`}
        />
      ) : (
        <>
          {posterSrc ? <img src={posterSrc} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} className={`${fill} object-cover`} /> : <div className={`${fill} bg-gradient-to-br from-[#1a1208] to-black`} />}
          {playing && embed && (
            <iframe
              src={embed} title={title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
              allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen={false}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none"
              // "cover" scales the 16:9 player up to fill any shape; otherwise it fits inside.
              style={cover ? { width: 'max(100%, 177.78cqh)', height: 'max(100%, 56.25cqw)' } : { width: 'min(100%, 177.78cqh)', height: 'min(100%, 56.25cqw)' }}
            />
          )}
        </>
      )}

      {failed && <p className="absolute inset-0 flex items-center justify-center text-center text-sm text-white/80 px-4">This video could not be played.</p>}

      {/* Waiting for a tap: reduced motion, data saver, or the browser blocked autoplay. */}
      {!playing && !failed && controls && (
        <button type="button" onClick={toggle} aria-label={`Play video: ${title}`}
          className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/15 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <span className="w-14 h-14 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-glow-md"><Icon name="play" className="w-6 h-6 translate-x-px" /></span>
        </button>
      )}

      {controls && playing && (
        <div className="absolute bottom-2.5 right-2.5 flex gap-2">
          {video.kind === 'file' && (
            <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!muted}
              className="icon-btn !w-9 !h-9 !bg-black/60 !text-white !border-white/25"><Icon name={muted ? 'mute' : 'volume'} /></button>
          )}
          <button type="button" onClick={toggle} aria-label="Pause video" className="icon-btn !w-9 !h-9 !bg-black/60 !text-white !border-white/25"><Icon name="pause" /></button>
        </div>
      )}
    </div>
  );
}
