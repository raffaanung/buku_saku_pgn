import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in .env');
    // Check if we can construct it? No.
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sqlPath = path.join(__dirname, '../db/create_categories_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL from create_categories_table.sql...');
    await pool.query(sql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
