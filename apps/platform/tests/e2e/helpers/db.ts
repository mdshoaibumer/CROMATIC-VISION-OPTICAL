import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' }); // Playwright runs from root

// Helper function to get DB Client
export function getDbClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'cromatic_user',
    password: process.env.POSTGRES_PASSWORD || 'cromatic_password_secret',
    database: process.env.POSTGRES_DB || 'cromatic_vision_db',
  });
  return client;
}

export async function clearTestUser(email: string) {
  const client = getDbClient();
  await client.connect();
  try {
    await client.query('DELETE FROM users WHERE email = $1', [email]);
  } finally {
    await client.end();
  }
}

export async function getUserFromDb(email: string) {
  const client = getDbClient();
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  } finally {
    await client.end();
  }
}

export async function clearTestOrders(email: string) {
  const client = getDbClient();
  await client.connect();
  try {
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      // Cascade deleting orders manually because of FKs
      const ordersRes = await client.query('SELECT id FROM orders WHERE user_id = $1', [userId]);
      for (const row of ordersRes.rows) {
        await client.query('DELETE FROM order_items WHERE order_id = $1', [row.id]);
        await client.query('DELETE FROM invoices WHERE order_id = $1', [row.id]);
        await client.query('DELETE FROM payments WHERE order_id = $1', [row.id]);
      }
      await client.query('DELETE FROM orders WHERE user_id = $1', [userId]);
    }
  } finally {
    await client.end();
  }
}

export async function getOrdersForUser(email: string) {
  const client = getDbClient();
  await client.connect();
  try {
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      const res = await client.query('SELECT * FROM orders WHERE user_id = $1', [userRes.rows[0].id]);
      return res.rows;
    }
    return [];
  } finally {
    await client.end();
  }
}

export async function setTestAdmin(email: string) {
  const client = getDbClient();
  await client.connect();
  try {
    await client.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email]);
  } finally {
    await client.end();
  }
}

/**
 * Returns the first order row for a user by email, or null if none exist.
 * Used by prescription and invoice E2E tests that require a valid order_id.
 */
export async function getFirstOrderForUser(email: string): Promise<{ id: number; user_id: string } | null> {
  const client = getDbClient();
  await client.connect();
  try {
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return null;
    const userId = userRes.rows[0].id;
    const orderRes = await client.query(
      'SELECT id, user_id FROM orders WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
      [userId]
    );
    return orderRes.rows.length > 0 ? orderRes.rows[0] : null;
  } finally {
    await client.end();
  }
}

/**
 * Returns the first invoice row for a user by email, or null if none exist.
 * Used by the invoice download E2E test.
 */
export async function getFirstInvoiceForUser(email: string): Promise<{ id: number; invoice_number: string } | null> {
  const client = getDbClient();
  await client.connect();
  try {
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return null;
    const userId = userRes.rows[0].id;
    const invRes = await client.query(
      `SELECT inv.id, inv.invoice_number
       FROM invoices inv
       JOIN orders o ON o.id = inv.order_id
       WHERE o.user_id = $1
       ORDER BY inv.created_at ASC LIMIT 1`,
      [userId]
    );
    return invRes.rows.length > 0 ? invRes.rows[0] : null;
  } finally {
    await client.end();
  }
}

export async function getSeededProductId(slug: string = 'premium-cut-optics'): Promise<number> {
  const client = getDbClient();
  await client.connect();
  try {
    const res = await client.query('SELECT id FROM products WHERE slug = $1 LIMIT 1', [slug]);
    return res.rows.length > 0 ? res.rows[0].id : 0;
  } finally {
    await client.end();
  }
}

