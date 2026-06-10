import { validateWebdavFilePath } from './security.js';

export interface EnvConfig {
  sitePassword: string;
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
  webdavFilePath: string;
  authSecret: string;
}

export function loadConfig(env: Record<string, string | undefined>): EnvConfig {
  const sitePassword = env.SITE_PASSWORD ?? '';
  const webdavUrl = env.WEBDAV_URL ?? '';
  const webdavUsername = env.WEBDAV_USERNAME ?? '';
  const webdavPassword = env.WEBDAV_PASSWORD ?? '';
  const webdavFilePath = validateWebdavFilePath(env.WEBDAV_FILE_PATH ?? 'basic.memos.md');
  const authSecret = env.AUTH_SECRET ?? sitePassword;

  if (!sitePassword) throw new Error('SITE_PASSWORD is required');
  if (!webdavUrl) throw new Error('WEBDAV_URL is required');
  if (!webdavUsername) throw new Error('WEBDAV_USERNAME is required');
  if (!webdavPassword) throw new Error('WEBDAV_PASSWORD is required');
  if (!env.AUTH_SECRET) {
    console.warn('[config] AUTH_SECRET is not set; session tokens use SITE_PASSWORD as signing key');
  }

  return {
    sitePassword,
    webdavUrl,
    webdavUsername,
    webdavPassword,
    webdavFilePath,
    authSecret,
  };
}
