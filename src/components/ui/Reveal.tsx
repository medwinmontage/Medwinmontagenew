'use client';
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';

// One IntersectionObserver shared by every <Reveal> on the page.
let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        callbacks.delete(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  return observer;
}

/**
 * Fades and slides its children in the first time they scroll into view.
 * Uses only opacity + transform (no layout shift), and the CSS turns the
 * effect off entirely under prefers-reduced-motion.
 */
export default function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    callbacks.set(el, () => setShown(true));
    const io = getObserver();
    io.observe(el);
    return () => { callbacks.delete(el); io.unobserve(el); };
  }, []);

  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;
  return <div ref={ref} className={`reveal ${shown ? 'is-in' : ''} ${className}`} style={style}>{children}</div>;
}
