// @ts-expect-error pg module type resolution fallback
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const rawUrl = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '').trim();

    // Avoid dead Supabase URL if present in legacy env
    const isSupabase =
      Boolean((rawUrl && rawUrl.includes('supabase.com')) ||
      (process.env.DATABASE_HOST && process.env.DATABASE_HOST.includes('supabase.com')));

    if (rawUrl && !isSupabase) {
      const url = rawUrl.split('?')[0];
      pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    } else {
      const host =
        !isSupabase && (process.env.DB_HOST || process.env.DATABASE_HOST)
          ? (process.env.DB_HOST || process.env.DATABASE_HOST)!
          : 'db-postgresql-blr1-57746-do-user-12834989-0.g.db.ondigitalocean.com';
      const port = parseInt(
        (!isSupabase && (process.env.DB_PORT || process.env.DATABASE_PORT)) || '25060',
        10
      );
      const database =
        !isSupabase && (process.env.DB_NAME || process.env.DATABASE_NAME)
          ? (process.env.DB_NAME || process.env.DATABASE_NAME)!
          : 'defaultdb';
      const user =
        !isSupabase && (process.env.DB_USER || process.env.DATABASE_USERNAME)
          ? (process.env.DB_USER || process.env.DATABASE_USERNAME)!
          : 'doadmin';
      const password = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD;

      pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }
  }
  return pool;
}

export async function queryDb<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return res.rows;
}
