'use client';
import { useEffect, useRef, useState } from 'react';
import { useModals } from './ModalContext';
import ThemeToggle from './ThemeToggle';
import Icon from './Icon';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_MARK } from '@/lib/brand';

const NAV = [
  ['Home', 'home'], ['Services', 'services'],
  ['Portfolio', 'portfolio'], ['Packages', 'packages'], ['Reviews', 'testimonials'], ['Contact', 'contact'],
] as const;

export default function Header({ showOffer, offerLive, logoUrl }: { showOffer: boolean; offerLive: boolean; logoUrl?: string }) {
  const { openBooking, openAccount, openOffer } = useModals();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>('home');
  const shellRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // More solid + elevated once the page has moved.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active link = the section currently crossing the middle of the screen.
  useEffect(() => {
    const sections = NAV.map(([, id]) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) setActive(e.target.id); },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Mobile menu: close on Escape, on a click/tap outside, and when resized up to desktop.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setMenuOpen(false); menuBtnRef.current?.focus(); }
    }
    function onPointer(e: PointerEvent) {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    const mq = window.matchMedia('(min-width: 1280px)');
    const onResize = () => { if (mq.matches) setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    mq.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      mq.removeEventListener('change', onResize);
    };
  }, [menuOpen]);

  const fromMenu = (fn: () => void) => () => { setMenuOpen(false); fn(); };

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-3 pt-3">
      <div ref={shellRef} className={`nav-shell relative max-w-6xl mx-auto ${scrolled || menuOpen ? 'is-scrolled' : ''}`}>
        <div className="flex items-center justify-between gap-4 pl-3.5 pr-2.5 py-2.5">
          <a href="#home" className="flex items-center gap-2.5 min-w-0" aria-label={`${BRAND_NAME} — ${BRAND_TAGLINE}`}>
            <img src={logoUrl || BRAND_MARK} alt="" width={40} height={40} className="h-10 w-10 object-contain flex-shrink-0" />
            <span className="min-w-0 leading-none">
              <span className="block font-display font-extrabold text-[15px] tracking-tight whitespace-nowrap">{BRAND_NAME}</span>
              <span className="block mt-1 text-[10.5px] font-semibold text-muted whitespace-nowrap">{BRAND_TAGLINE}</span>
            </span>
          </a>

          <nav aria-label="Main" className="hidden xl:flex items-center gap-5">
            {NAV.map(([label, id]) => (
              <a key={id} href={`#${id}`} className="nav-link" aria-current={active === id ? 'true' : undefined}>{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showOffer && (
              <button type="button" onClick={openOffer} className="icon-btn hidden xl:inline-flex" aria-label="View current offer" title="Current offer">
                <Icon name="gift" />
                {offerLive && <span aria-hidden className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--accent-rgb))]" />}
              </button>
            )}
            <ThemeToggle className="hidden xl:inline-flex" />
            <button type="button" onClick={openAccount} aria-label="My account" title="My account" className="icon-btn hidden xl:inline-flex">
              <Icon name="user" />
            </button>
            <button type="button" onClick={openBooking} className="btn btn-primary hidden sm:inline-flex">Book For Event</button>
            <button
              ref={menuBtnRef}
              type="button"
              className="icon-btn xl:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        <div id="mobile-menu" data-open={menuOpen} className="mobile-menu xl:hidden absolute left-0 right-0 top-full mt-2">
          <div className="card !bg-paper p-2.5 max-h-[calc(100dvh-110px)] overflow-y-auto shadow-lift">
            <nav aria-label="Mobile" className="flex flex-col gap-0.5">
              {NAV.map(([label, id]) => (
                <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)} className="mobile-link" aria-current={active === id ? 'true' : undefined}>{label}</a>
              ))}
            </nav>
            <div className="my-2 border-t border-line" />
            <div className="flex flex-col gap-0.5">
              {showOffer && (
                <button type="button" onClick={fromMenu(openOffer)} className="mobile-link"><Icon name="gift" /> Current offer</button>
              )}
              <button type="button" onClick={fromMenu(openAccount)} className="mobile-link"><Icon name="user" /> My account</button>
              <ThemeToggle showLabel />
            </div>
            <button type="button" onClick={fromMenu(openBooking)} className="btn btn-primary btn-cta w-full mt-3">Book For Event</button>
          </div>
        </div>
      </div>
    </header>
  );
}
