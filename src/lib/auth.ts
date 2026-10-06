import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// jose (not jsonwebtoken) because it works in both the Node runtime and the
// Edge runtime that middleware.ts runs in.

// Secrets are read when a token is signed or checked (not at import time, so
// `next build` works without them). In production a missing secret is an
// error: falling back to a known default would let anyone forge a session.
function secret(name: 'ADMIN_JWT_SECRET' | 'CUSTOMER_JWT_SECRET', devFallback: string): Uint8Array {
  const value = process.env[name];
  if (!value || value.length < 16) {
    if (process.env.NODE_ENV === 'production') throw new Error(`${name} is not set (or is shorter than 16 characters).`);
    return new TextEncoder().encode(value || devFallback);
  }
  return new TextEncoder().encode(value);
}
const adminSecret = () => secret('ADMIN_JWT_SECRET', 'dev-only-insecure-admin-secret');
const customerSecret = () => secret('CUSTOMER_JWT_SECRET', 'dev-only-insecure-customer-secret');

const TOKEN_TTL = '7d';

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export type AdminTokenPayload = { sub: string; username: string; role: string };
export type CustomerTokenPayload = { sub: string; name: string; email: string };

export async function signAdminToken(payload: AdminTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(adminSecret());
}
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, adminSecret());
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function signCustomerToken(payload: CustomerTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(customerSecret());
}
export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, customerSecret());
    return payload as unknown as CustomerTokenPayload;
  } catch {
    return null;
  }
}
