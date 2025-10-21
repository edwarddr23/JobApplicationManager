import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export async function testConnection() {
  let connected = false;
  let attempts = 0;

  while (!connected && attempts < 10) {
    try {
      await pool.query('SELECT 1');
      console.log('Postgres connected');
      connected = true;
    } catch (err) {
      attempts++;
      console.error('Postgres connection error', err instanceof Error ? err.message : err);
      await new Promise(r => setTimeout(r, 2000)); // 2 sec delay
    }
  }

  if (!connected) {
    throw new Error('Could not connect to Postgres after multiple attempts');
  }
}
