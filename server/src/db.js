import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function ensureDb() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(sql);
  } finally {
    client.release();
  }
}
