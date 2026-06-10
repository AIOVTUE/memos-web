import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApiRequest } from '../server/handler.js';

export const config = {
  api: {
    bodyParser: true,
  },
};

function toEnv(): Record<string, string | undefined> {
  return {
    SITE_PASSWORD: process.env.SITE_PASSWORD,
    WEBDAV_URL: process.env.WEBDAV_URL,
    WEBDAV_USERNAME: process.env.WEBDAV_USERNAME,
    WEBDAV_PASSWORD: process.env.WEBDAV_PASSWORD,
    WEBDAV_FILE_PATH: process.env.WEBDAV_FILE_PATH,
    AUTH_SECRET: process.env.AUTH_SECRET,
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
  };
}

function resolvePathname(req: VercelRequest): string {
  const pathParam = req.query.path;
  if (pathParam) {
    const segments = Array.isArray(pathParam) ? pathParam : [pathParam];
    return `/api/${segments.map(String).join('/')}`;
  }

  const raw = req.url?.split('?')[0] ?? '';
  if (raw.startsWith('/api/')) return raw;
  if (raw.startsWith('/')) return `/api${raw}`;
  return '/api';
}

function buildRequest(req: VercelRequest): Request {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host = req.headers.host ?? 'localhost';
  const pathname = resolvePathname(req);
  const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const url = `${proto}://${host}${pathname}${query}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
  }

  return new Request(url, init);
}

async function sendResponse(res: VercelResponse, response: Response): Promise<void> {
  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const existing = res.getHeader('Set-Cookie');
      if (existing) {
        const list = Array.isArray(existing) ? existing : [String(existing)];
        res.setHeader('Set-Cookie', [...list, value]);
      } else {
        res.setHeader('Set-Cookie', value);
      }
    } else {
      res.setHeader(key, value);
    }
  });
  const text = await response.text();
  res.send(text);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await handleApiRequest(buildRequest(req), toEnv());
    await sendResponse(res, response);
  } catch (e) {
    console.error('[vercel-api]', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
