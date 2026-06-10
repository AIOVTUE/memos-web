import {
  clearSessionCookie,
  createSessionToken,
  extractToken,
  sessionCookie,
  verifySessionToken,
} from './auth.js';
import { loadConfig } from './config.js';
import {
  checkLoginRateLimit,
  corsHeaders,
  resetLoginRateLimit,
  timingSafeEqual,
} from './security.js';
import { parseThinoFile, serializeThinoFile } from './thino/parser.js';
import { fetchMemosFile, saveMemosFile } from './webdav.js';

function isSecureRequest(req: Request): boolean {
  const url = new URL(req.url);
  if (url.protocol === 'https:') return true;
  const forwarded = req.headers.get('x-forwarded-proto');
  return forwarded === 'https';
}

function json(
  req: Request,
  env: Record<string, string | undefined>,
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(req, env),
      ...extraHeaders,
    },
  });
}

function error(
  req: Request,
  env: Record<string, string | undefined>,
  message: string,
  status = 400,
): Response {
  return json(req, env, { error: message }, status);
}

async function requireAuth(req: Request, env: Record<string, string | undefined>): Promise<Response | null> {
  const config = loadConfig(env);
  const token = extractToken(req);
  if (!token || !(await verifySessionToken(token, config.authSecret))) {
    return error(req, env, 'Unauthorized', 401);
  }
  return null;
}

export async function handleApiRequest(
  req: Request,
  env: Record<string, string | undefined>,
): Promise<Response> {
  const cors = corsHeaders(req, env);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const url = new URL(req.url);
  let path = url.pathname.replace(/\/+$/, '') || '/';
  path = path.replace(/^\/\.netlify\/functions\/api/, '/api');
  if (!path.startsWith('/api')) {
    path = `/api${path.startsWith('/') ? path : `/${path}`}`;
  }

  try {
    if (path.endsWith('/api/auth/login') && req.method === 'POST') {
      if (!checkLoginRateLimit(req)) {
        return error(req, env, 'Too many login attempts, try again later', 429);
      }

      const config = loadConfig(env);
      const body = (await req.json()) as { password?: string };
      const password = body.password ?? '';

      if (!timingSafeEqual(password, config.sitePassword)) {
        return error(req, env, 'Invalid password', 401);
      }

      resetLoginRateLimit(req);
      const token = await createSessionToken(config.authSecret);
      return json(
        req,
        env,
        { ok: true },
        200,
        { 'Set-Cookie': sessionCookie(token, 7 * 24 * 60 * 60, isSecureRequest(req)) },
      );
    }

    if (path.endsWith('/api/auth/logout') && req.method === 'POST') {
      return json(req, env, { ok: true }, 200, {
        'Set-Cookie': clearSessionCookie(isSecureRequest(req)),
      });
    }

    if (path.endsWith('/api/auth/check') && req.method === 'GET') {
      const config = loadConfig(env);
      const token = extractToken(req);
      const valid = token ? await verifySessionToken(token, config.authSecret) : false;
      return json(req, env, { authenticated: valid });
    }

    const authError = await requireAuth(req, env);
    if (authError) return authError;

    const config = loadConfig(env);

    if (path.endsWith('/api/memos') && req.method === 'GET') {
      const raw = await fetchMemosFile(config);
      const notes = parseThinoFile(raw);
      return json(req, env, { notes });
    }

    if (path.endsWith('/api/memos') && req.method === 'PUT') {
      const body = (await req.json()) as { content?: string; notes?: unknown };
      if (typeof body.content === 'string') {
        await saveMemosFile(config, body.content);
        return json(req, env, { ok: true });
      }
      if (Array.isArray(body.notes)) {
        const content = serializeThinoFile(body.notes as Parameters<typeof serializeThinoFile>[0]);
        await saveMemosFile(config, content);
        return json(req, env, { ok: true });
      }
      return error(req, env, 'Missing content or notes');
    }

    return error(req, env, 'Not found', 404);
  } catch (e) {
    console.error('[api]', e);
    return error(req, env, 'Internal server error', 500);
  }
}
