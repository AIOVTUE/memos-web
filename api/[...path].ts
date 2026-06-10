import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApiRequest } from '../server/handler.js';

function toEnv(): Record<string, string | undefined> {
  return {
    SITE_PASSWORD: process.env.SITE_PASSWORD,
    WEBDAV_URL: process.env.WEBDAV_URL,
    WEBDAV_USERNAME: process.env.WEBDAV_USERNAME,
    WEBDAV_PASSWORD: process.env.WEBDAV_PASSWORD,
    WEBDAV_FILE_PATH: process.env.WEBDAV_FILE_PATH,
    AUTH_SECRET: process.env.AUTH_SECRET,
  };
}

function buildRequest(req: VercelRequest): Request {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host = req.headers.host ?? 'localhost';
  const url = `${proto}://${host}${req.url ?? '/api'}`;
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
  const response = await handleApiRequest(buildRequest(req), toEnv());
  await sendResponse(res, response);
}
