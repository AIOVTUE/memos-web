import type { Handler, HandlerEvent } from '@netlify/functions';
import { handleApiRequest } from '../../server/handler.js';

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

function buildRequest(event: HandlerEvent): Request {
  const url =
    event.rawUrl ??
    `${event.headers['x-forwarded-proto'] ?? 'https'}://${event.headers.host ?? 'localhost'}${event.path}${event.rawQuery ? `?${event.rawQuery}` : ''}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers)) {
    if (value) headers.set(key, value);
  }

  const init: RequestInit = { method: event.httpMethod, headers };
  if (event.body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    init.body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
  }

  return new Request(url, init);
}

export const handler: Handler = async (event) => {
  try {
    const response = await handleApiRequest(buildRequest(event), toEnv());
    const body = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      statusCode: response.status,
      headers,
      body,
    };
  } catch (e) {
    console.error('[netlify-api]', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
