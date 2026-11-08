const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.AUTH_SECRET ||
  'recovery-credit-6-secure-session-hmac-secret-v1-2026';

export interface TokenPayload {
  id: string;
  username: string;
  role: 'admin' | 'collector';
  mustChangePassword?: boolean;
  exp: number; // unix timestamp in ms
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function signData(dataStr: string, secret: string = SECRET_KEY): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(dataStr));
  const bytes = new Uint8Array(sig);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Generates a signed, tamper-proof session token.
 * Default validity: 14 days for enterprise mobility.
 */
export async function createSessionToken(
  user: { id: string; username: string; role: 'admin' | 'collector'; mustChangePassword?: boolean },
  durationMs: number = 14 * 24 * 60 * 60 * 1000
): Promise<string> {
  const payload: TokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    exp: Date.now() + durationMs,
  };

  const payloadStr = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadStr);
  const signature = await signData(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a session token across both Node.js and Next.js Edge Runtime.
 * Returns payload if valid and not expired, null otherwise.
 */
export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, providedSignature] = parts;
    const expectedSignature = await signData(encodedPayload);

    // Constant-time character comparison to prevent timing attacks
    if (providedSignature.length !== expectedSignature.length) return null;
    let mismatch = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      mismatch |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));

    if (!payload.exp || Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
