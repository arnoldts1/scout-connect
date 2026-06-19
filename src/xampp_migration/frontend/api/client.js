/**
 * api/client.js
 * Thin HTTP client that wraps fetch() for the PHP backend.
 * Drop this into src/api/ of the migrated React app.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost/scout_connect/backend';

function getToken() {
  return localStorage.getItem('auth_token');
}

async function request(method, path, body = null, params = {}) {
  const url = new URL(`${BASE_URL}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(url.toString(), opts);

  if (res.status === 204) return null;

  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json;
}

export const http = {
  get:    (path, params)       => request('GET',    path, null, params),
  post:   (path, body, params) => request('POST',   path, body, params),
  patch:  (path, body, params) => request('PATCH',  path, body, params),
  put:    (path, body, params) => request('PUT',    path, body, params),
  delete: (path, params)       => request('DELETE', path, null, params),
};