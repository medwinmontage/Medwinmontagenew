import { cookies } from 'next/headers';
import {
  signAdminToken, verifyAdminToken, AdminTokenPayload,
  signCustomerToken, verifyCustomerToken, CustomerTokenPayload,
  signCrewToken, verifyCrewToken, CrewTokenPayload,
} from './auth';

export const ADMIN_COOKIE = 'medwin_admin_session';
export const CUSTOMER_COOKIE = 'medwin_customer_session';
export const CREW_COOKIE = 'medwin_crew_session';

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// ---- Admin session (Route Handlers + Server Components) ----

export async function setAdminSession(payload: AdminTokenPayload) {
  const token = await signAdminToken(payload);
  (await cookies()).set(ADMIN_COOKIE, token, cookieOpts);
}
export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
/** Use inside API route handlers. Returns the session or null — caller decides how to respond. */
export async function requireAdmin(): Promise<AdminTokenPayload | null> {
  return getAdminSession();
}

// ---- Customer session ----

export async function setCustomerSession(payload: CustomerTokenPayload) {
  const token = await signCustomerToken(payload);
  (await cookies()).set(CUSTOMER_COOKIE, token, cookieOpts);
}
export async function clearCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}
export async function getCustomerSession(): Promise<CustomerTokenPayload | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

// ---- Customer identity for API routes ----
// The customer id ALWAYS comes from the signed session cookie, then the row is
// re-read so a suspended or deleted account stops working immediately even
// though its 7-day token is still valid. Never take a customer id from the
// request body or query string.
export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session?.sub) return null;
  const { prisma } = await import('./prisma');
  const customer = await prisma.customer.findUnique({ where: { id: session.sub } });
  if (!customer || customer.status === 'Suspended') return null;
  return customer;
}

// ---- Crew session ----
// Same rules as the customer session: the id comes only from the signed cookie,
// and the row is re-read on every request so a deleted account stops working at once.

export async function setCrewSession(payload: CrewTokenPayload) {
  const token = await signCrewToken(payload);
  (await cookies()).set(CREW_COOKIE, token, cookieOpts);
}
export async function clearCrewSession() {
  (await cookies()).delete(CREW_COOKIE);
}
export async function getCrewSession(): Promise<CrewTokenPayload | null> {
  const token = (await cookies()).get(CREW_COOKIE)?.value;
  if (!token) return null;
  return verifyCrewToken(token);
}
export async function requireCrew() {
  const session = await getCrewSession();
  if (!session?.sub) return null;
  const { prisma } = await import('./prisma');
  return prisma.crewAccount.findUnique({ where: { id: session.sub } });
}
