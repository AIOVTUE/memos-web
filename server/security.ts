const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  const maxLen = Math.max(bufA.length, bufB.length);
  let result = bufA.length ^ bufB.length;
  for (let i = 0; i < maxLen; i++) {
    result |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return result === 0;
}

export function validateWebdavFilePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) throw new Error('WEBDAV_FILE_PATH is required');
  if (trimmed.includes('..')) throw new Error('WEBDAV_FILE_PATH must not contain ..');
  if (trimmed.startsWith('/') || trimmed.startsWith('\\')) {
    throw new Error('WEBDAV_FILE_PATH must be relative');
  }
  if (/^[a-zA-Z]:/.test(trimmed)) {
    throw new Error('WEBDAV_FILE_PATH must be relative');
  }
  return trimmed;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('cf-connecting-ip') ?? 'unknown';
}

export function checkLoginRateLimit(req: Request): boolean {
  const key = getClientIp(req);
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }

  if (entry.count >= LOGIN_MAX_ATTEMPTS) return false;

  entry.count += 1;
  return true;
}

export function resetLoginRateLimit(req: Request): void {
  loginAttempts.delete(getClientIp(req));
}

export function corsHeaders(
  req: Request,
  env: Record<string, string | undefined>,
): Record<string, string> {
  const origin = req.headers.get('Origin');
  if (!origin) return {};

  const requestOrigin = new URL(req.url).origin;
  const allowedOrigins = (env.ALLOWED_ORIGIN ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const permitted =
    origin === requestOrigin || allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  if (!permitted) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
