import express, { Request, Response } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { QueryResult } from 'pg';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  userId?: number;
}

/* =============================
   Fetch all companies endpoint.
============================= */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

  try {
    const result = await pool.query(
      `SELECT id, user_id, name, website, location, created_at
       FROM companies
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json({
      count: result.rowCount,
      companies: result.rows.map(row => ({
        id: row.id,
        // true if the company was added by this user, false if it was a seeded one
        user_id: row.user_id === req.userId,
        name: row.name,
        website: row.website || null,
        location: row.location || null,
        created_at: row.created_at
      }))
    });
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/* =============================
   Add company endpoint.
============================= */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

  const { name, website, location } = req.body;

  if (!name) return res.status(400).json({ error: 'Company name is required.' });

  try {
    // Check if the company already exists for this user
    const companyResult = await pool.query(
      'SELECT id, user_id FROM companies WHERE name = $1 AND user_id = $2',
      [name, req.userId]
    );

    if (companyResult.rows.length > 0) {
      return res.status(409).json({
        message: 'You have already added this company.',
        companyId: companyResult.rows[0].id,
        isUserAdded: true
      });
    }

    // Insert the new company
    const insertResult = await pool.query(
      `INSERT INTO companies (name, website, location, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, website || null, location || null, req.userId]
    );

    res.json({
      message: 'Company added successfully',
      companyId: insertResult.rows[0].id,
      isUserAdded: true
    });

  } catch (err) {
    console.error('Error adding company:', err);
    res.status(500).json({ error: 'Server error while adding company' });
  }
});

/* =============================
   Delete company endpoint.
============================= */
router.delete('/:companyId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

  const { companyId } = req.params;

  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

  try {
    const result = await pool.query(
      'DELETE FROM companies WHERE id = $1 AND user_id = $2 RETURNING id',
      [companyId, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Company not found or not owned by user' });
    }

    res.json({ message: 'Company removed successfully', companyId: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting company:', err);
    res.status(500).json({ error: 'Server error while removing company' });
  }
});

/* =============================
   Edit company functionality.
============================= */
router.put('/:companyId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

  const { companyId } = req.params;
  const { name, website, location } = req.body;

  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  if (!name && !website && !location) return res.status(400).json({ error: 'At least one field (name, website, location) must be provided' });

  try {
    const companyResult = await pool.query(
      'SELECT id FROM companies WHERE name = $1 AND (user_id IS NULL OR user_id = $2)',
      [name, req.userId]
    );

    if (companyResult.rowCount === 0) return res.status(404).json({ error: 'Company not found or not owned by user' });

    const fields: string[] = [];
    const values: any[] = [];
    let counter = 1;

    if (name) { fields.push(`name = $${counter++}`); values.push(name); }
    if (website) { fields.push(`website = $${counter++}`); values.push(website); }
    if (location) { fields.push(`location = $${counter++}`); values.push(location); }

    values.push(companyId, req.userId);

    const updateQuery = `
      UPDATE companies
      SET ${fields.join(', ')}
      WHERE id = $${counter++} AND user_id = $${counter}
      RETURNING *
    `;

    const updatedCompany = await pool.query(updateQuery, values);

    res.json({ message: 'Company updated successfully', company: updatedCompany.rows[0] });
  } catch (err) {
    console.error('Error updating company:', err);
    res.status(500).json({ error: 'Server error while updating company' });
  }
});

export default router;