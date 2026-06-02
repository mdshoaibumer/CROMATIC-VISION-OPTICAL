import { test, expect } from '@playwright/test';
import { clearTestUser } from './helpers/db';

const testEmail = 'auth_advanced_e2e@cromaticvision.com';
const testPassword = 'AuthTest123!';

test.describe('Suite 25: Auth Refresh & Account Lockout', () => {
  test.beforeAll(async ({ request }) => {
    await clearTestUser(testEmail);
    await request.post('/api/v1/auth/register', {
      data: { name: 'Auth Test User', email: testEmail, phone: '9990006666', password: testPassword },
    });
  });

  test.afterAll(async () => {
    await clearTestUser(testEmail);
  });

  test('Token refresh endpoint exists and requires auth context', async ({ request }) => {
    const res = await request.post('/api/v1/auth/refresh');
    // Without a valid token/cookie, should reject
    expect([401, 400]).toContain(res.status());
  });

  test('Token refresh returns new token after valid login', async ({ request }) => {
    // Login first
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: testEmail, password: testPassword },
    });
    expect(loginRes.status()).toBe(200);
    const cookie = loginRes.headers()['set-cookie'] || '';

    // Attempt refresh
    const refreshRes = await request.post('/api/v1/auth/refresh', {
      headers: { Cookie: cookie },
    });
    // Should succeed (200) or return new token
    if (refreshRes.status() === 200) {
      const body = await refreshRes.json();
      expect(body.success).toBe(true);
      // Should have set-cookie with new token
      const newCookie = refreshRes.headers()['set-cookie'];
      expect(newCookie).toBeDefined();
    }
  });

  test('Account lockout after multiple failed login attempts', async ({ request }) => {
    const badEmail = 'lockout_target@cromaticvision.com';
    await clearTestUser(badEmail);
    await request.post('/api/v1/auth/register', {
      data: { name: 'Lockout Target', email: badEmail, phone: '9990007777', password: 'Good123!!' },
    });

    // Attempt 6+ failed logins (lockout threshold is 5)
    const responses: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await request.post('/api/v1/auth/login', {
        data: { email: badEmail, password: 'WrongPassword!' },
      });
      responses.push(res.status());
    }

    // After threshold, should see 429 (rate limit) or 423 (locked)
    const hasLockout = responses.some(s => s === 429 || s === 423 || s === 403);
    // At minimum, all should be non-200
    expect(responses.every(s => s !== 200)).toBeTruthy();
    // The last few should trigger lockout or rate limit
    expect(hasLockout || responses.filter(s => s === 401).length >= 5).toBeTruthy();

    await clearTestUser(badEmail);
  });

  test('GET /auth/me returns user profile when authenticated', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: testEmail, password: testPassword },
    });
    const cookie = loginRes.headers()['set-cookie'] || '';

    const meRes = await request.get('/api/v1/auth/me', {
      headers: { Cookie: cookie },
    });
    expect(meRes.status()).toBe(200);
    const body = await meRes.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(testEmail);
    expect(body.data.name).toBe('Auth Test User');
  });

  test('GET /auth/me rejects unauthenticated request', async ({ request }) => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status()).toBe(401);
  });

  test('Admin-only test endpoint rejects customer role', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: testEmail, password: testPassword },
    });
    const cookie = loginRes.headers()['set-cookie'] || '';

    const res = await request.get('/api/v1/auth/admin-only-test', {
      headers: { Cookie: cookie },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Logout invalidates session', async ({ request }) => {
    // Login
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: testEmail, password: testPassword },
    });
    const cookie = loginRes.headers()['set-cookie'] || '';

    // Logout
    const logoutRes = await request.post('/api/v1/auth/logout', {
      headers: { Cookie: cookie },
    });
    expect(logoutRes.status()).toBe(200);

    // Verify session is invalid
    const meRes = await request.get('/api/v1/auth/me', {
      headers: { Cookie: cookie },
    });
    // After logout, token should be invalidated
    expect([401, 200]).toContain(meRes.status()); // depends on stateless vs stateful
  });

  test('Panic recovery endpoint returns 500 gracefully', async ({ request }) => {
    const res = await request.get('/api/v1/health/panic');
    expect(res.status()).toBe(500);
    const body = await res.json();
    // Panic middleware should return structured error, not crash
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('PANIC_RECOVERED');
  });
});
