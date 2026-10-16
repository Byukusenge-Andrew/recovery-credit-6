import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const neonDatabaseUrl =
  process.env.OLD_DATABASE_URL ||
  'postgresql://neondb_owner:npg_URykixod0Tm1@ep-silent-unit-b4ulwsrt-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  console.log('Connecting to Neon PostgreSQL database at:', neonDatabaseUrl.replace(/:[^:@]+@/, ':****@'));
  const pool = new Pool({
    connectionString: neonDatabaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  // 1. Show existing tables before wiping
  const beforeTables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  console.log('Tables found before wipe:', beforeTables.rows.map((t: any) => t.table_name));

  // 2. Wipe public schema clean
  console.log('Wiping all tables and schema in Neon database...');
  await pool.query('DROP SCHEMA public CASCADE;');
  await pool.query('CREATE SCHEMA public;');
  await pool.query('GRANT ALL ON SCHEMA public TO neondb_owner;');
  await pool.query('GRANT ALL ON SCHEMA public TO public;');
  console.log('Schema wiped clean.');

  // 3. Recreate fresh schema from schema.sql
  console.log('Recreating fresh schema from schema.sql...');
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err: any) {
      console.error('Error executing statement:', statement.substring(0, 50), err.message);
    }
  }

  // 4. Seed default admin
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
  console.log('Fresh default admin seeded (admin / admin).');

  // 5. Verify final clean state
  const afterTables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  console.log('Fresh clean tables in Neon PostgreSQL:', afterTables.rows.map((t: any) => t.table_name));

  await pool.end();
  console.log('Neon database wipe and clean initialization complete!');
}

main().catch(err => {
  console.error('Neon wipe failed:', err);
  process.exit(1);
});
