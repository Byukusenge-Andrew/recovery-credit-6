import { Pool, QueryResultRow } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/recovery_credit';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not defined; defaulting to local postgresql.');
}

const isNeon = connectionString.includes('neon.tech');

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
};

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString,
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgPool = pool;
}

export interface SqlFunction {
  <T extends QueryResultRow = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]>;
  query: <T extends QueryResultRow = any>(text: string, params?: any[]) => Promise<T[]>;
}

export const sql: SqlFunction = (async function sql<T extends QueryResultRow = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  let queryText = '';
  for (let i = 0; i < strings.length; i++) {
    queryText += strings[i];
    if (i < values.length) {
      queryText += `$${i + 1}`;
    }
  }
  const result = await pool.query<T>(queryText, values);
  return result.rows;
}) as SqlFunction;

sql.query = async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
};
