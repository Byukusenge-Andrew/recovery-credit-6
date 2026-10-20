import crypto from 'crypto';

const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.AUTH_SECRET ||
  'recovery-credit-6-secure-session-hmac-secret-v1-2026';

export interface TokenPayload {
  id: string;
  username: string;
  role: 'admin' | 'collector';
  exp: number; // unix timestamp in ms
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Generates a signed, tamper-proof session token.
 * Default validity: 7 days.
 */
export function createSessionToken(
  user: { id: string; username: string; role: 'admin' | 'collector' },
  durationMs: number =  24 * 60 * 60 * 1000
): string {
  const payload: TokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + durationMs
  };

  const payloadStr = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadStr);

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encodedPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a session token.
 * Returns payload if valid and not expired, null otherwise.
 */
export function verifySessionToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, providedSignature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(encodedPayload)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Constant-time comparison to prevent timing attacks
    const sigA = Buffer.from(providedSignature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));

    if (!payload.exp || Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
