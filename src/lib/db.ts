import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is not defined.');
}

export const sql = neon(process.env.DATABASE_URL || '');
