'use client';
import { useRouter } from 'next/navigation';
import AuthForms from './AuthForms';

export default function AccountGate() {
  const router = useRouter();
  return (
    <div className="max-w-md mx-auto px-5 pt-14 pb-20">
      <h1 className="font-display font-extrabold text-3xl text-center mb-2">My Account</h1>
      <p className="text-muted text-center mb-7">Log in to see your bookings, service history, quotes and feedback.</p>
      <div className="card p-6"><AuthForms onAuthed={() => router.refresh()} /></div>
    </div>
  );
}
