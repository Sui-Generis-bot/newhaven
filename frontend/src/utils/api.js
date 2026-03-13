// utils/api.js
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || `Error ${res.status}`);
  return data;
}

export const api = {
  auth: {
    login:  (body)  => request('/auth/login',  { method: 'POST', body }),
    logout: ()      => request('/auth/logout', { method: 'POST' }),
    me:     ()      => request('/auth/me'),
  },
  contacts: {
    list:   (params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([,v]) => v !== undefined && v !== '')
      ).toString();
      return request(`/contacts${qs ? '?' + qs : ''}`);
    },
    get:    (id)    => request(`/contacts/${id}`),
    create: (body)  => request('/contacts',     { method: 'POST', body }),
    update: (id, b) => request(`/contacts/${id}`, { method: 'PUT', body: b }),
    delete: (id)    => request(`/contacts/${id}`, { method: 'DELETE' }),
  }
};
