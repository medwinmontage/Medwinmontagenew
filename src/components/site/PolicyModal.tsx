'use client';
import Modal from '@/components/ui/Modal';

const TITLES: Record<string, string> = { privacy: 'Privacy Policy', terms: 'Terms & Conditions', refund: 'Refund Policy' };

// Shows a policy's text. Policies configured as an external link are opened
// directly by the footer and never reach this dialog.
export default function PolicyModal({ policyKey, content, onClose }: { policyKey: 'privacy' | 'terms' | 'refund' | null; content: any; onClose: () => void }) {
  const text = policyKey ? content[`${policyKey}Text`] : '';
  return (
    <Modal open={!!policyKey} onClose={onClose} title={policyKey ? TITLES[policyKey] : ''} size="md">
      <div className="text-sm text-ink-2 whitespace-pre-wrap leading-relaxed">
        {text || 'This policy has not been added yet.'}
      </div>
    </Modal>
  );
}
