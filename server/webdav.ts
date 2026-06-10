import type { EnvConfig } from './config.js';

function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function basicAuth(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

export async function fetchMemosFile(config: EnvConfig): Promise<string> {
  const url = joinUrl(config.webdavUrl, config.webdavFilePath);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: basicAuth(config.webdavUsername, config.webdavPassword),
    },
  });

  if (res.status === 404) return '';
  if (!res.ok) {
    throw new Error(`WebDAV GET failed: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

export async function saveMemosFile(config: EnvConfig, content: string): Promise<void> {
  const url = joinUrl(config.webdavUrl, config.webdavFilePath);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: basicAuth(config.webdavUsername, config.webdavPassword),
      'Content-Type': 'text/markdown; charset=utf-8',
    },
    body: content,
  });

  if (!res.ok) {
    throw new Error(`WebDAV PUT failed: ${res.status} ${res.statusText}`);
  }
}
