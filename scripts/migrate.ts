import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/recovery_credit';

async function main() {
  console.log('Connecting to PostgreSQL database at:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  const isNeon = databaseUrl.includes('neon.tech');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  });

  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');

  // Split statements and execute
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      console.error('Error executing statement:', statement.substring(0, 50), err);
    }
  }

  // Seed default admin if not exists
  const existingAdmin = await pool.query("SELECT * FROM users WHERE username = 'admin' LIMIT 1");
  if (existingAdmin.rows.length === 0) {
    await pool.query(`
      INSERT INTO users (id, username, password, role, full_name, email, is_email_verified)
      VALUES (
        'usr-admin-default',
        'admin',
        'admin',
        'admin',
        'Administrator',
        'admin@recoverycredit.internal',
        TRUE
      )
    `);
    console.log('Default admin seeded (admin / admin).');
  } else {
    console.log('Admin user already exists.');
  }

  // Check tables
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log('Initialized tables in PostgreSQL:', tables.rows.map((t: any) => t.table_name));

  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
