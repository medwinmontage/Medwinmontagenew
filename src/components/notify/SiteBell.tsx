'use client';
import { useCallback, useEffect, useState } from 'react';
import NotificationBell from './NotificationBell';

type Me = { customer: { sub: string } | null; crew: { sub: string } | null };

/** Header bell(s) for whoever is signed in on the public site: customer, crew, or both. */
export default function SiteBell() {
  const [me, setMe] = useState<Me | null>(null);
  const check = useCallback(() => {
    fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => setMe({ customer: d.customer, crew: d.crew })).catch(() => {});
  }, []);
  useEffect(() => {
    check();
    // Sign-in/out forms announce themselves, so the bell appears (or goes) without a page reload.
    window.addEventListener('mm-auth', check);
    return () => window.removeEventListener('mm-auth', check);
  }, [check]);

  return (
    <>
      {me?.customer && <NotificationBell kind="customer" topic={`mm-customer-${me.customer.sub}`} seeAllHref="/account" />}
      {me?.crew && <NotificationBell kind="crew" topic={`mm-crew-${me.crew.sub}`} seeAllHref="/crew" />}
    </>
  );
}
