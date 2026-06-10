import type { PagesFunction } from '@cloudflare/workers-types';
import { handleApiRequest } from '../../server/handler.js';

interface Env {
  SITE_PASSWORD?: string;
  WEBDAV_URL?: string;
  WEBDAV_USERNAME?: string;
  WEBDAV_PASSWORD?: string;
  WEBDAV_FILE_PATH?: string;
  AUTH_SECRET?: string;
  ALLOWED_ORIGIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  return handleApiRequest(context.request, context.env as Record<string, string | undefined>);
};
