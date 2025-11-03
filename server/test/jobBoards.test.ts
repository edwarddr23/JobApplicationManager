import assert from 'assert';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { describe, it, before, after } from 'node:test';
import { v4 as uuidv4 } from 'uuid';
import { pool, testConnection } from '../db/index'; // .ts not needed with ts-node
import dotenv from 'dotenv';
import path from 'path';

declare global {
  // You can pick types that match your data
  var TEST_USER_ID: string;
  var TEST_JWT: string;
}

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
console.log('JWT_SECRET=', process.env.JWT_SECRET);

interface JobBoardsResponse {
  job_boards: Array<{ id: string; name: string; url: string; user_id?: string }>;
}

interface AddJobBoardResponse {
  isUserAdded: boolean;
}

const SERVER_URL = 'http://localhost:5000';

describe('Job Boards Endpoints', () => {
  before(async () => {
    // Ensure DB connection
    await testConnection();

    // Get seeded user 'alice'
    const { rows } = await pool.query(
      `SELECT id FROM users WHERE username = $1 LIMIT 1`,
      ['alice']
    );

    if (rows.length === 0) {
      throw new Error("Seed user 'alice' not found in the database. Make sure your seed script ran.");
    }

    // Use Alice's actual user ID
    const aliceId = rows[0].id;

    // Generate JWT for Alice
    globalThis.TEST_USER_ID = aliceId;
    globalThis.TEST_JWT = jwt.sign({ userId: aliceId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  after(async () => {
    // Clean up user-added job boards
    await pool.query('DELETE FROM job_boards WHERE user_id = $1', [globalThis.TEST_USER_ID]);
  });

  it('should fetch all job boards', async () => {
    const res = await fetch(`${SERVER_URL}/job-boards`, {
      headers: { Authorization: `Bearer ${globalThis.TEST_JWT}` },
    });

    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as JobBoardsResponse; // <-- cast here
    assert.ok(Array.isArray(data.job_boards));
  });

  it('should add a new user job board', async () => {
    const newBoard = { name: 'TestBoard', url: 'https://testboard.com' };

    const res = await fetch(`${SERVER_URL}/job-board`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_JWT}` },
      body: JSON.stringify(newBoard),
    });

    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as AddJobBoardResponse; // <-- cast here
    assert.ok(data.isUserAdded);
  });

  it('should delete a user-added job board', async () => {
    // Insert one directly
    const { rows } = await pool.query(
      `INSERT INTO job_boards (name, url, user_id)
       VALUES ($1, $2, $3) RETURNING id`,
      ['DeleteBoard', 'https://deleteboard.com', TEST_USER_ID]
    );
    const jobBoardId = rows[0].id;

    const res = await fetch(`${SERVER_URL}/job-boards/${jobBoardId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TEST_JWT}` },
    });

    assert.strictEqual(res.status, 200);

    const check = await pool.query('SELECT * FROM job_boards WHERE id = $1', [jobBoardId]);
    assert.strictEqual(check.rowCount, 0);
  });
});
