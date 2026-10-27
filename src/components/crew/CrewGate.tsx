'use client';
import { useRouter } from 'next/navigation';
import AuthForms from '@/components/site/AuthForms';

/** Log in / register as crew. After signing in the page re-renders with the signed-in view. */
export default function CrewGate({ title, intro }: { title: string; intro: string }) {
  const router = useRouter();
  return (
    <div className="max-w-md mx-auto">
      <h2 className="font-display font-extrabold text-2xl text-center mb-2">{title}</h2>
      <p className="text-muted text-center text-sm mb-6">{intro}</p>
      <div className="card p-6"><AuthForms kind="crew" onAuthed={() => router.refresh()} /></div>
    </div>
  );
}
