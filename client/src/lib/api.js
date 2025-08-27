// Simple fetch-based API client with JWT auth
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getToken = () => localStorage.getItem('token');
export const getUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const saveAuth = ({ token, user }) => {
  if (token) localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export async function api(path, { method = 'GET', headers = {}, body, auth = true } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  const token = getToken();
  if (auth && token) h['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors
  }

  if (res.status === 401) {
    clearAuth();
    throw new Error((data && data.error) || 'Unauthorized');
  }
  if (!res.ok) {
    throw new Error((data && data.error) || 'Request failed');
  }
  return data || {};
}

// Multipart/form-data request (do not set Content-Type explicitly)
export async function apiFormData(path, { method = 'POST', formData, auth = true } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (res.status === 401) {
    clearAuth();
    throw new Error((data && data.error) || 'Unauthorized');
  }
  if (!res.ok) {
    throw new Error((data && data.error) || 'Request failed');
  }
  return data || {};
}

export const AuthAPI = {
  register(payload) {
    return api('/auth/register', { method: 'POST', body: payload, auth: false });
  },
  login(payload) {
    return api('/auth/login', { method: 'POST', body: payload, auth: false });
  },
};

export const EquipmentAPI = {
  create(formData) {
    return apiFormData('/equipment', { method: 'POST', formData });
  },
  list() {
    return api('/equipment', { method: 'GET' });
  },
  get(id) {
    return api(`/equipment/${id}`, { method: 'GET' });
  },
  imageUrl(id) {
    return `${API_BASE}/equipment/${id}/image`;
  },
};

export const BookingAPI = {
  checkAvailability(payload) {
    // { equipmentId, date: 'YYYY-MM-DD', time: 'HH:mm', durationMinutes: number }
    return api('/bookings/availability', { method: 'POST', body: payload, auth: false });
  },
  create(payload) {
    // { equipmentId, date, time, durationMinutes, purpose }
    return api('/bookings', { method: 'POST', body: payload, auth: true });
  },
  listAll() {
    // Admin: list all bookings
    return api('/bookings', { method: 'GET', auth: true });
  },
  listMine() {
    // Authenticated user's own bookings
    return api('/bookings/mine', { method: 'GET', auth: true });
  },
  list({ status } = {}) {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return api(`/bookings${qs}`, { method: 'GET', auth: true });
  },
  listConfirmed() {
  return api('/bookings/confirmed', { method: 'GET', auth: false });
  },
  setStatus(id, status, reason = '') {
    return api(`/bookings/${id}/status`, { method: 'PATCH', body: { status, reason }, auth: true });
  },
};
