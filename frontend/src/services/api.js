// Central API client — every frontend request goes through here.
// Dev: Vite proxies /api → http://localhost:5000 (works on desktop + mobile via the Network URL)
// Prod: set VITE_API_BASE=https://your-api.example.com/api
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Fired when the server rejects the session; AuthContext listens and logs out.
export const AUTH_EXPIRED_EVENT = 'frelock:auth-expired';

const networkError = () =>
  new Error('Cannot reach the server. Make sure the backend is running (cd backend && npm run dev).');

const request = async (path, { token, method = 'GET', body, headers } = {}) => {
  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
  } catch {
    throw networkError();
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    throw new Error('Invalid server response');
  }

  if (!res.ok) {
    // 401 = expired/invalid token; 403 with "frozen" = account frozen mid-session
    if (token && (res.status === 401 || (res.status === 403 && /frozen/i.test(data?.error || '')))) {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: data?.error }));
    }
    const error = new Error(data?.error || 'Request failed');
    error.status = res.status;
    throw error;
  }
  return data;
};

// Authenticated request. `options.body` may be an object or a JSON string.
export const apiFetch = (path, token, options = {}) => request(path, { ...options, token });

// Unauthenticated (or optionally authenticated) POST — used by login/register.
export const apiPost = (path, body, token = null) => request(path, { method: 'POST', body, token });

export const loginUser = ({ email, password, role }) =>
  apiPost('/auth/login', { email, password, role });

export const registerUser = ({ email, password, role, name }) =>
  apiPost('/auth/register', { email, password, role, name });

