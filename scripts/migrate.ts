import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_URykixod0Tm1@ep-silent-unit-b4ulwsrt-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log('Connecting to Neon PostgreSQL...');
  const sql = neon(databaseUrl);

  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
  
  // Split statements and execute
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await sql.query(statement);
    } catch (err) {
      console.error('Error executing statement:', statement.substring(0, 50), err);
    }
  }

  // Seed default admin if not exists
  const existingAdmin = await sql`SELECT * FROM users WHERE username = 'admin' LIMIT 1`;
  if (existingAdmin.length === 0) {
    await sql`
      INSERT INTO users (id, username, password, role, full_name, email, is_email_verified)
      VALUES (
        'usr-admin-default',
        'admin',
        'admin123',
        'admin',
        'Administrator',
        'admin@recoverycredit.internal',
        TRUE
      )
    `;
    console.log('Default admin seeded (admin / admin123).');
  } else {
    console.log('Admin user already exists.');
  }

  // Check tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  console.log('Initialized tables in Neon:', tables.map((t: any) => t.table_name));
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
