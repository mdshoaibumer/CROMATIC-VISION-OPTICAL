/**
 * API-based test helpers for the in-memory dev server.
 * No PostgreSQL dependency — all operations use the REST API.
 */

const API_BASE = 'http://localhost:8080/api/v1';

export async function registerUser(name: string, email: string, phone: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, password }),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const cookies = res.headers.get('set-cookie') || '';
  return { status: res.status, data: await res.json().catch(() => null), cookies };
}

export async function getAuthCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.get('set-cookie') || '';
}

// No-ops for in-memory dev mode (data resets on server restart)
export async function clearTestUser(_email: string) { /* no-op */ }
export async function getUserFromDb(_email: string) { return undefined; }
export async function clearTestOrders(_email: string) { /* no-op */ }
export async function getOrdersForUser(_email: string) { return []; }
export async function setTestAdmin(_email: string) { /* no-op — use admin@cromatic.dev */ }
export async function getFirstOrderForUser(_email: string) { return null; }
export async function getFirstInvoiceForUser(_email: string) { return null; }
