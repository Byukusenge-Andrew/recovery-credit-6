import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Public API endpoints that do not require an active session token
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/whatsapp/webhook',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply to API routes
  if (pathname.startsWith('/api')) {
    // 1. Handle CORS preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, x-user-id, x-user-role, x-username',
          'Access-Control-Max-Age': '86400',
          ...SECURITY_HEADERS,
        },
      });
    }

    // 2. Allow server health ping on /api/notifications without credentials (only when no username query is passed)
    if (pathname === '/api/notifications' && !request.nextUrl.searchParams.has('username')) {
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 3. Allow public routes
    const isPublic = PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
    if (isPublic) {
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 4. Authenticate Protected API Routes
    let token = '';

    // Check Authorization: Bearer <token>
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // Fallback: x-auth-token
    if (!token) {
      token = request.headers.get('x-auth-token') || '';
    }

    // Fallback: Cookie rc6_auth_token
    if (!token) {
      const cookie = request.cookies.get('rc6_auth_token');
      if (cookie) {
        token = cookie.value;
      }
    }

    // Verify token
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Session authentication token required.' },
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            ...SECURITY_HEADERS,
          },
        }
      );
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired session token.' },
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            ...SECURITY_HEADERS,
          },
        }
      );
    }

    // 5. Role-Based Access Control (RBAC) Enforcement
    if (payload.role !== 'admin') {
      // a. Audit logs are strictly admin-only
      if (pathname.startsWith('/api/audit')) {
        return NextResponse.json(
          { error: 'Forbidden: Administrator privileges required to access audit trail.' },
          { status: 403, headers: { 'Access-Control-Allow-Origin': '*', ...SECURITY_HEADERS } }
        );
      }

      // b. Creating collectors / user management is strictly admin-only
      if (pathname === '/api/collectors' && request.method === 'POST') {
        return NextResponse.json(
          { error: 'Forbidden: Administrator privileges required to register collectors.' },
          { status: 403, headers: { 'Access-Control-Allow-Origin': '*', ...SECURITY_HEADERS } }
        );
      }

      // c. Bulk dossier upload is strictly admin-only
      if (pathname.startsWith('/api/debtors/bulk')) {
        return NextResponse.json(
          { error: 'Forbidden: Administrator privileges required for bulk upload.' },
          { status: 403, headers: { 'Access-Control-Allow-Origin': '*', ...SECURITY_HEADERS } }
        );
      }

      // d. Deleting any core entity (debtor, institution, payment) is strictly admin-only
      if (request.method === 'DELETE') {
        return NextResponse.json(
          { error: 'Forbidden: Record deletion is strictly restricted to Administrators.' },
          { status: 403, headers: { 'Access-Control-Allow-Origin': '*', ...SECURITY_HEADERS } }
        );
      }

      // e. Creating or modifying financial institutions is strictly admin-only
      if (pathname.startsWith('/api/institutions') && (request.method === 'POST' || request.method === 'PATCH' || request.method === 'PUT')) {
        return NextResponse.json(
          { error: 'Forbidden: Only administrators can create or modify partner institutions.' },
          { status: 403, headers: { 'Access-Control-Allow-Origin': '*', ...SECURITY_HEADERS } }
        );
      }

      // f. Editing previously recorded payments is strictly admin-only
      if (pathname.startsWith('/api/payments/') && request.method === 'PATCH') {
        return NextResponse.json(
          { error: 'Forbidden: Previously recorded payment receipts can only be amended by an administrator.' },
          { status: 403, headers: { 'Access-Control-Allow-Origin': '*', ...SECURITY_HEADERS } }
        );
      }
    }

    // 6. Forward verified claims down to API route handlers via trusted headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-verified-user-id', payload.id);
    requestHeaders.set('x-verified-username', payload.username);
    requestHeaders.set('x-verified-role', payload.role);
    if (payload.mustChangePassword) {
      requestHeaders.set('x-verified-must-change-password', 'true');
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, x-user-id, x-user-role, x-username');
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Non-API routes: attach security headers
  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
