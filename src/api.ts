async function parseResponse<T>(res: Response): Promise<T & { error?: string }> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? '服务器返回空响应，请检查 API 路由是否已正确部署'
        : `请求失败 (${res.status})：服务器未返回有效 JSON，请确认 /api 函数已部署且环境变量已配置`,
    );
  }

  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    const preview = text.slice(0, 80).replace(/\s+/g, ' ');
    throw new Error(
      `服务器响应异常 (${res.status})：${preview}${text.length > 80 ? '…' : ''}`,
    );
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const data = await parseResponse<T>(res);
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
