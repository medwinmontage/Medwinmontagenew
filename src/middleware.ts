import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Same rule as src/lib/auth.ts: in production the secret must be set. Without
// this, anyone could forge a token signed with the public development default.
function adminSecret(): Uint8Array | null {
  const value = process.env.ADMIN_JWT_SECRET;
  if (value && value.length >= 16) return new TextEncoder().encode(value);
  return process.env.NODE_ENV === 'production' ? null : new TextEncoder().encode(value || 'dev-only-insecure-admin-secret');
}
const ADMIN_COOKIE = 'medwin_admin_session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  // --- 1. Host-based rewrite: admin.yourdomain.com -> /admin ---
  // This is what makes a *standalone admin URL* real: point admin.yourdomain.com's
  // DNS at the same deployment, and this rewrite serves the /admin app there —
  // no separate deployment or codebase needed. Swap the prefix check below for
  // your real domain before going live (e.g. host === 'admin.medwinmontage.com').
  const isAdminHost = host.startsWith('admin.');
  const needsRewrite = isAdminHost && !pathname.startsWith('/admin') && !pathname.startsWith('/api');
  const effectivePath = needsRewrite ? `/admin${pathname === '/' ? '' : pathname}` : pathname;

  // --- 2. Protect everything under /admin except the login page ---
  const isProtectedAdminRoute = effectivePath.startsWith('/admin') && effectivePath !== '/admin/login';
  if (isProtectedAdminRoute) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    let valid = false;
    const secret = adminSecret();
    if (token && secret) {
      try {
        await jwtVerify(token, secret);
        valid = true;
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- 3. Apply the rewrite (after the auth check above has already run against effectivePath) ---
  if (needsRewrite) {
    const url = req.nextUrl.clone();
    url.pathname = effectivePath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
