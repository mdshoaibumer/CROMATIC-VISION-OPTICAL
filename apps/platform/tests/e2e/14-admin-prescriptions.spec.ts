import { test, expect } from '@playwright/test';
import { clearTestUser, clearTestOrders, setTestAdmin, getSeededProductId, getFirstOrderForUser } from './helpers/db';
import path from 'path';
const adminPassword = 'AdminRx123!';

// TODO: Re-enable once admin prescription review endpoints are stable
test.describe.skip('Suite 14: Admin Prescription Review', () => {
  test.beforeAll(async ({ request }) => {
    await clearTestUser(adminEmail);
    await request.post('/api/v1/auth/register', {
      data: { name: 'Prescription Admin', email: adminEmail, phone: '9990004444', password: adminPassword },
    });
    await setTestAdmin(adminEmail);
  });

  test.afterAll(async () => {
    await clearTestUser(adminEmail);
  });

  let adminCookie: string;

  test.beforeEach(async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: adminEmail, password: adminPassword },
    });
    expect(loginRes.status()).toBe(200);
    adminCookie = loginRes.headers()['set-cookie'] || '';
  });

  test('Admin can list all prescriptions', async ({ request }) => {
    const res = await request.get('/api/v1/admin/prescriptions', {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('Admin can view prescription detail by ID', async ({ request }) => {
    const listRes = await request.get('/api/v1/admin/prescriptions', {
      headers: { Cookie: adminCookie },
    });
    const listBody = await listRes.json();

    if (listBody.data && Array.isArray(listBody.data) && listBody.data.length > 0) {
      const rxId = listBody.data[0].id;
      const detailRes = await request.get(`/api/v1/admin/prescriptions/${rxId}`, {
        headers: { Cookie: adminCookie },
      });
      expect(detailRes.status()).toBe(200);
      const detail = await detailRes.json();
      expect(detail.success).toBe(true);
      expect(detail.data.id).toBe(rxId);
    }
  });

  test('Admin can approve a prescription', async ({ request }) => {
    const listRes = await request.get('/api/v1/admin/prescriptions', {
      headers: { Cookie: adminCookie },
    });
    const listBody = await listRes.json();

    if (listBody.data && Array.isArray(listBody.data) && listBody.data.length > 0) {
      const pendingRx = listBody.data.find((rx: any) => rx.status === 'pending');
      if (pendingRx) {
        const res = await request.put(`/api/v1/admin/prescriptions/${pendingRx.id}/status`, {
          headers: { Cookie: adminCookie },
          data: { status: 'approved' },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.data.status).toBe('approved');
        expect(body.message).toContain('updated');
      }
    }
  });

  test('Admin can reject a prescription', async ({ request }) => {
    const listRes = await request.get('/api/v1/admin/prescriptions', {
      headers: { Cookie: adminCookie },
    });
    const listBody = await listRes.json();

    if (listBody.data && Array.isArray(listBody.data) && listBody.data.length > 0) {
      const pendingRx = listBody.data.find((rx: any) => rx.status === 'pending');
      if (pendingRx) {
        const res = await request.put(`/api/v1/admin/prescriptions/${pendingRx.id}/status`, {
          headers: { Cookie: adminCookie },
          data: { status: 'rejected' },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.data.status).toBe('rejected');
      }
    }
  });

  test('Invalid prescription status returns 400', async ({ request }) => {
    const listRes = await request.get('/api/v1/admin/prescriptions', {
      headers: { Cookie: adminCookie },
    });
    const listBody = await listRes.json();

    if (listBody.data && Array.isArray(listBody.data) && listBody.data.length > 0) {
      const rxId = listBody.data[0].id;
      const res = await request.put(`/api/v1/admin/prescriptions/${rxId}/status`, {
        headers: { Cookie: adminCookie },
        data: { status: 'invalid_status' },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('Non-existent prescription returns 404', async ({ request }) => {
    const res = await request.get('/api/v1/admin/prescriptions/999999', {
      headers: { Cookie: adminCookie },
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  test('Unauthenticated access is rejected', async ({ request }) => {
    const res = await request.get('/api/v1/admin/prescriptions');
    expect([401, 403]).toContain(res.status());
  });
});

