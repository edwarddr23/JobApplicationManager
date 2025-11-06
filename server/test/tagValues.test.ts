import assert from 'assert';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { describe, it, before, after } from 'node:test';
import { pool, testConnection } from '../db/index';
import dotenv from 'dotenv';
import path from 'path';

declare global {
  var TEST_USER_ID: string;
  var TEST_JWT: string;
}

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
console.log('JWT_SECRET=', process.env.JWT_SECRET);

const SERVER_URL = 'http://localhost:5000';

interface TagValue {
  id: string;
  user_id: string;
  tag: string;
  value: string;
  type: 'link' | 'text';
}

interface GetTagValuesResponse {
  tagvalues: TagValue[];
}

interface AddTagValueResponse {
  id: string;
  user_id: string;
  tag: string;
  value: string;
  type: 'link' | 'text';
}

interface PatchTagValueResponse {
  tagvalue: TagValue;
}

describe('TagValues Endpoints', () => {
  let createdTagValueId: string;

  before(async () => {
    // Ensure DB connection
    await testConnection();

    // Get seeded user 'alice'
    const { rows } = await pool.query(
      `SELECT id FROM users WHERE username = $1 LIMIT 1`,
      ['alice']
    );

    if (rows.length === 0) {
      throw new Error("Seed user 'alice' not found. Run seed script first.");
    }

    globalThis.TEST_USER_ID = rows[0].id;
    globalThis.TEST_JWT = jwt.sign({ userId: TEST_USER_ID }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  after(async () => {
    // Clean up user-added tagvalues
    await pool.query('DELETE FROM tagvalues WHERE user_id = $1', [globalThis.TEST_USER_ID]);
  });

  it('should fetch all tagvalues for the user', async () => {
    const res = await fetch(`${SERVER_URL}/tagvalues`, {
      headers: { Authorization: `Bearer ${globalThis.TEST_JWT}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  it('should add a new tagvalue', async () => {
    const newTagValue = {
      tag: 'Test Tag',
      value: 'https://testvalue.com',
      type: 'link' as 'link',
    };

    const res = await fetch(`${SERVER_URL}/tagvalues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_JWT}` },
      body: JSON.stringify(newTagValue),
    });

    assert.strictEqual(res.status, 201);
    const data = (await res.json()) as AddTagValueResponse;
    assert.strictEqual(data.tag, newTagValue.tag);
    assert.strictEqual(data.value, newTagValue.value);
    assert.strictEqual(data.type, newTagValue.type);
    createdTagValueId = data.id;
  });

  it('should update a tagvalue', async () => {
    const updatedData = { value: 'https://updatedvalue.com', tag: 'Updated Tag', type: 'text' as 'text' };

    const res = await fetch(`${SERVER_URL}/tagvalues/${createdTagValueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_JWT}` },
      body: JSON.stringify(updatedData),
    });

    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as PatchTagValueResponse;
    assert.strictEqual(data.tagvalue.id, createdTagValueId);
    assert.strictEqual(data.tagvalue.value, updatedData.value);
    assert.strictEqual(data.tagvalue.tag, updatedData.tag);
    assert.strictEqual(data.tagvalue.type, updatedData.type);
  });

  it('should delete a tagvalue', async () => {
    const res = await fetch(`${SERVER_URL}/tagvalues/${createdTagValueId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TEST_JWT}` },
    });

    assert.strictEqual(res.status, 200);

    // Ensure it is gone from DB
    const check = await pool.query('SELECT * FROM tagvalues WHERE id = $1', [createdTagValueId]);
    assert.strictEqual(check.rowCount, 0);
  });
});