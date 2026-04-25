import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './index.js';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  console.log('Running migrations...');
  await pool.query(sql);
  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
