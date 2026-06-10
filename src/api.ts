async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  checkAuth: () => request<{ authenticated: boolean }>('/api/auth/check'),

  login: (password: string) =>
    request<{ ok: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  logout: () =>
    request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  getMemos: () =>
    request<{ notes: import('./types.js').ThinoNote[] }>('/api/memos'),

  saveMemos: (notes: import('./types.js').ThinoNote[]) =>
    request<{ ok: boolean }>('/api/memos', {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
};
