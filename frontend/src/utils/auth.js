// src/utils/auth.js
function safeAtob(b64) {
  // รองรับ base64url ( -_ แทน +/ ) และเติม '=' ให้ครบ
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  if (typeof atob === 'function') return atob(base64);
  // เผื่อ SSR/Node: ใช้ Buffer
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function getToken() {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export function setToken(t) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('token', t || '');
}

export function clearToken() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('token');
}

export function parseJwt(token) {
  try {
    const parts = (token || '').split('.');
    if (parts.length < 2) return null;
    const payload = safeAtob(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function isExpired(token) {
  const p = parseJwt(token);
  if (!p?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return p.exp <= now;
}

export function getRoleName(token) {
  return parseJwt(token)?.role_name ?? null;
}

/** roles: string[] เช่น ['auditor','head_auditor'] */
export function hasAnyRole(token, roles = []) {
  if (!roles?.length) return true;
  const role = getRoleName(token);
  if (!role) return false;
  return Array.isArray(role) ? role.some(r => roles.includes(r)) : roles.includes(role);
}

/** header ใช้สะดวกเวลายิง API */
export function authHeader() {
  const t = getToken();
  return t ? { Authorization: t.startsWith('Bearer ') ? t : `Bearer ${t}` } : {};
}
