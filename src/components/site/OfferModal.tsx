'use client';
import { useEffect, useState } from 'react';
import { useModals } from './ModalContext';
import Modal from '@/components/ui/Modal';
import Icon from './Icon';

type Offer = { enabled: boolean; text: string; url: string; endAt: string } | null;

/**
 * The timed offer with its countdown and "Claim offer" link, and the
 * "Book offer" waitlist. (Banners are separate now — see BannerCarousel.)
 * It is CLOSED by default and opens only from the small gift button in the
 * header (or "Current offer" in the mobile menu). Admin switches still decide
 * what appears inside it — nothing about the offer data or its API has changed.
 */
export default function OfferModal({ offer, bookOfferEnabled }: { offer: Offer; bookOfferEnabled: boolean }) {
  const { state, closeOffer, openWizard } = useModals();
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const open = state.offer;
  const endAt = offer?.enabled ? offer.endAt : null;

  // The countdown only ticks while the panel is open.
  useEffect(() => {
    if (!open || !endAt) { setLeft(null); return; }
    const end = new Date(endAt).getTime();
    function tick() {
      const diff = end - Date.now();
      if (diff <= 0) { setLeft(null); return; }
      setLeft({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [open, endAt]);

  const live = !!offer?.enabled && !!left;

  function claim() {
    if (offer?.url) { window.open(offer.url, '_blank', 'noopener'); closeOffer(); }
    else openWizard(undefined, 'offer');
  }

  return (
    <Modal open={open} onClose={closeOffer} title="Current offer" size="md">
      <div className="flex flex-col gap-5">
        {live && left ? (
          <div>
            <p className="font-display font-bold text-xl leading-snug mb-4">{offer!.text}</p>
            <p className="label">Offer ends in</p>
            <div className="grid grid-cols-4 gap-2" role="timer" aria-label={`${left.d} days ${left.h} hours ${left.m} minutes left`}>
              {([['days', left.d], ['hours', left.h], ['min', left.m], ['sec', left.s]] as const).map(([unit, value]) => (
                <div key={unit} className="rounded-xl border border-line bg-paper-2 py-3 text-center">
                  <b className="block font-display text-2xl tabular-nums text-accent-ink">{String(value).padStart(2, '0')}</b>
                  <span className="text-[11px] text-muted">{unit}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No timed offer is running right now. Join the waitlist and we&rsquo;ll message you when the next one opens.</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {live && (
            <button type="button" onClick={claim} className="btn btn-primary btn-cta flex-1">
              <Icon name="gift" /> Claim offer
            </button>
          )}
          {bookOfferEnabled && (!live || !!offer?.url) && (
            <button type="button" onClick={() => openWizard(undefined, 'offer')} className={`btn flex-1 ${live ? 'btn-secondary' : 'btn-primary'}`}>
              Book offer
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
