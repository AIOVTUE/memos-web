import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { handleApiRequest } from '../server/handler.ts';

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');
  const result = {};
  try {
    const text = readFileSync(envPath, 'utf-8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  } catch {
    // no .env file
  }
  return result;
}

const dotEnv = loadDotEnv();

function toEnv() {
  return {
    SITE_PASSWORD: process.env.SITE_PASSWORD ?? dotEnv.SITE_PASSWORD,
    WEBDAV_URL: process.env.WEBDAV_URL ?? dotEnv.WEBDAV_URL,
    WEBDAV_USERNAME: process.env.WEBDAV_USERNAME ?? dotEnv.WEBDAV_USERNAME,
    WEBDAV_PASSWORD: process.env.WEBDAV_PASSWORD ?? dotEnv.WEBDAV_PASSWORD,
    WEBDAV_FILE_PATH: process.env.WEBDAV_FILE_PATH ?? dotEnv.WEBDAV_FILE_PATH,
    AUTH_SECRET: process.env.AUTH_SECRET ?? dotEnv.AUTH_SECRET,
  };
}

const port = Number(process.env.PORT ?? 8788);

createServer(async (req, res) => {
  const host = req.headers.host ?? 'localhost';
  const url = `http://${host}${req.url ?? '/'}`;
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const body = Buffer.concat(chunks);
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
      const init = { method: req.method, headers };
      if (body.length > 0 && req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = body;
      }
      const request = new Request(url, init);
      const response = await handleApiRequest(request, toEnv());
      res.statusCode = response.status;
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
      res.end(text);
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }));
    }
  });
}).listen(port, () => {
  console.log(`Memos API dev server listening on http://localhost:${port}`);
});
