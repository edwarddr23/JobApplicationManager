import { pool } from './index';

export async function createUsersTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      email TEXT,
      password TEXT NOT NULL
    );
  `;
  await pool.query(query);
  console.log('Users table ensured.');
}

export async function createCompaniesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      website TEXT,
      location TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  await pool.query(query);
  console.log('Companies table ensured.');
}

export async function createJobBoardsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS job_boards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      url TEXT
    );
  `;
  await pool.query(query);
  console.log('Job boards table ensured.');
}

export async function createApplicationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS applications (
      user_id UUID REFERENCES users(id),
      company_id UUID REFERENCES companies(id),
      job_board_id UUID REFERENCES job_boards(id),
      status TEXT CHECK (status IN ('applied','offer','rejected','withdrawn')),
      applied_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, company_id, job_board_id)
    );
  `;
  await pool.query(query);
  console.log('Applications table ensured.');
}

export async function initializeTables() {
  await createUsersTable();
  await createCompaniesTable();
  await createJobBoardsTable();
  await createApplicationsTable();
  console.log('All tables initialized.');
}
