'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type ModalState = { booking: boolean; wizard: boolean; wizardPreset?: string; wizardMode: 'service' | 'offer'; quote: boolean; account: boolean; offer: boolean };
type ModalApi = {
  state: ModalState;
  openBooking: () => void;
  closeBooking: () => void;
  openWizard: (preset?: string, mode?: 'service' | 'offer') => void;
  closeWizard: () => void;
  openQuote: () => void;
  closeQuote: () => void;
  openAccount: () => void;
  closeAccount: () => void;
  openOffer: () => void;
  closeOffer: () => void;
};

const Ctx = createContext<ModalApi | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  // Everything starts closed — including the offer, which only opens when a visitor asks for it.
  const [state, setState] = useState<ModalState>({ booking: false, wizard: false, wizardMode: 'service', quote: false, account: false, offer: false });
  return (
    <Ctx.Provider
      value={{
        state,
        openBooking: () => setState((s) => ({ ...s, booking: true })),
        closeBooking: () => setState((s) => ({ ...s, booking: false })),
        openWizard: (preset, mode) => setState((s) => ({ ...s, offer: false, wizard: true, wizardPreset: preset, wizardMode: mode || 'service' })),
        closeWizard: () => setState((s) => ({ ...s, wizard: false, wizardPreset: undefined })),
        openQuote: () => setState((s) => ({ ...s, quote: true })),
        closeQuote: () => setState((s) => ({ ...s, quote: false })),
        openAccount: () => setState((s) => ({ ...s, account: true })),
        closeAccount: () => setState((s) => ({ ...s, account: false })),
        openOffer: () => setState((s) => ({ ...s, offer: true })),
        closeOffer: () => setState((s) => ({ ...s, offer: false })),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useModals() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useModals must be used within <ModalProvider>');
  return ctx;
}
