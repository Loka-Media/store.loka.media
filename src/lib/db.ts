// @ts-ignore
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL.split('?')[0];
      pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
      });
    } else {
      const host = process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost';
      const port = parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432', 10);
      const database = process.env.DB_NAME || process.env.DATABASE_NAME || 'defaultdb';
      const user = process.env.DB_USER || process.env.DATABASE_USERNAME || 'doadmin';
      const password = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD;
      const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };
      pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ssl,
        max: 10,
        idleTimeoutMillis: 30000,
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
