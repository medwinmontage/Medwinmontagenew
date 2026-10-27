import { Suspense } from 'react';
import NotificationCenter from '@/components/admin/NotificationCenter';

export default function AdminNotificationsPage() {
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">Notifications</h2>
      <p className="text-sm text-muted mb-5 max-w-[70ch]">New bookings, requests, reviews and messages arrive here live. Send a notification to one customer or crew member, or to everyone — they see it on the site straight away.</p>
      <Suspense fallback={null}><NotificationCenter /></Suspense>
    </div>
  );
}
