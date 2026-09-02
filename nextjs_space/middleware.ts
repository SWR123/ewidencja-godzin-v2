import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// RATE LIMITING logowania (w pamięci procesu)
// Ochrona /api/auth/callback/credentials przed brute-force.
// Limit: 5 prób / 5 minut na adres IP.
// ============================================================

const LOGIN_LIMIT = 5;
const WINDOW_MS = 5 * 60 * 1000;

// ip -> { count, resetAt }
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.ip || 'unknown';
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  // Limit tylko dla prób logowania (POST)
  if (url === '/api/auth/callback/credentials' && req.method === 'POST') {
    const ip = getClientIp(req);
    const now = Date.now();
    const rec = attempts.get(ip);

    if (!rec || now >= rec.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return NextResponse.next();
    }

    rec.count += 1;
    if (rec.count > LOGIN_LIMIT) {
      return NextResponse.json(
        { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 5 minut.' },
        { status: 429 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/callback/credentials'],
};