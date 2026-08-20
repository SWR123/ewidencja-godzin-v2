// Prosty rate-limiter w pamięci (per-email + per-IP) chroniący logowanie przed brute-force.
// Stan żyje w pamięci procesu — resetuje się przy restarcie kontenera (akceptowalne).

type Bucket = { count: number; resetAt: number };

const MAX_EMAIL_ATTEMPTS = 5;      // max nieudanych prób na email
const MAX_IP_ATTEMPTS = 15;        // max nieudanych prób na IP
const WINDOW_MS = 15 * 60 * 1000;  // okno 15 minut

const emailBuckets = new Map<string, Bucket>();
const ipBuckets = new Map<string, Bucket>();

function isLimited(map: Map<string, Bucket>, key: string, max: number): boolean {
  if (!key) return false;
  const now = Date.now();
  const b = map.get(key);
  if (!b) return false;
  if (now >= b.resetAt) {
    map.delete(key);
    return false;
  }
  return b.count >= max;
}

function record(map: Map<string, Bucket>, key: string): void {
  if (!key) return;
  const now = Date.now();
  const b = map.get(key);
  if (!b || now >= b.resetAt) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    b.count += 1;
  }
}

function reset(map: Map<string, Bucket>, key: string): void {
  if (key) map.delete(key);
}

export function isEmailLimited(email: string): boolean {
  return isLimited(emailBuckets, email.toLowerCase(), MAX_EMAIL_ATTEMPTS);
}

export function isIpLimited(ip: string): boolean {
  return isLimited(ipBuckets, ip, MAX_IP_ATTEMPTS);
}

export function recordEmailFailure(email: string): void {
  record(emailBuckets, email.toLowerCase());
}

export function recordIpFailure(ip: string): void {
  record(ipBuckets, ip);
}

export function resetEmail(email: string): void {
  reset(emailBuckets, email.toLowerCase());
}

export function resetIp(ip: string): void {
  reset(ipBuckets, ip);
}
