'use client';
import { ReactNode, useEffect, useId, useRef } from 'react';
import Icon from '@/components/site/Icon';

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-xl' } as const;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog shell used by every modal on the site.
 * Bottom sheet on phones, centred dialog from 640px up.
 * Closes on Escape and on backdrop click, traps Tab, locks page scroll and
 * hands focus back to whatever opened it.
 */
export default function Modal({ open, onClose, title, size = 'md', children }: {
  open: boolean; onClose: () => void; title: ReactNode; size?: keyof typeof SIZES; children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`modal-panel ${SIZES[size]}`}>
        <div className="flex justify-between items-center gap-4 px-5 sm:px-6 py-4 border-b border-line">
          <h3 id={titleId} className="font-display font-bold text-lg">{title}</h3>
          <button type="button" onClick={onClose} className="icon-btn !w-9 !h-9" aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
