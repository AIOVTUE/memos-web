import { handleApiRequest } from '../server/handler.js';

interface Env {
  SITE_PASSWORD?: string;
  WEBDAV_URL?: string;
  WEBDAV_USERNAME?: string;
  WEBDAV_PASSWORD?: string;
  WEBDAV_FILE_PATH?: string;
  AUTH_SECRET?: string;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api')) {
      return handleApiRequest(request, env as Record<string, string | undefined>);
    }

    return env.ASSETS.fetch(request);
  },
};
