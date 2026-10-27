'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';

type Mode = 'light' | 'dark';

/**
 * The theme itself is applied before first paint by the inline script in
 * layout.tsx (saved choice → site default → device setting). This button only
 * reads what is already on <html>, flips it, and saves the visitor's choice.
 */
export default function ThemeToggle({ className = '', showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    const read = () => setMode(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    read();
    // Stay in sync when another toggle on the page (e.g. the mobile menu one) changes the theme.
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  function toggle() {
    const root = document.documentElement;
    const next: Mode = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* private mode: the choice just won't persist */ }
    window.setTimeout(() => root.classList.remove('theme-switching'), 400);
  }

  const label = mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  const icon = <Icon name={mode === 'dark' ? 'sun' : 'moon'} className={mode === 'dark' ? 'rotate-0' : '-rotate-12'} />;

  if (showLabel) {
    return (
      <button type="button" onClick={toggle} className={`mobile-link ${className}`}>
        {icon}{mode === 'dark' ? 'Light theme' : 'Dark theme'}
      </button>
    );
  }
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={`icon-btn ${className}`}>
      {icon}
    </button>
  );
}
