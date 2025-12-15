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
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        website,
        location,
        user_id = $1 AS "userAdded"
      FROM companies
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY name ASC
      `,
      [req.userId]
    );

    res.json({ companies: result.rows });
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
   Update company endpoint.
============================= */
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, website, location } = req.body;

  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
  }

  if (!name?.trim() && !website?.trim() && !location?.trim()) {
    return res.status(400).json({ error: 'At least one of name, website, or location must be provided.' });
  }

  try {
    // Check for duplicate company name for this user
    if (name?.trim()) {
      const dupCheck = await pool.query(
        `SELECT id FROM companies WHERE user_id = $1 AND name = $2 AND id != $3`,
        [req.userId, name.trim(), id]
      );

      if (dupCheck.rowCount > 0) {
        return res.status(409).json({ error: 'You already have a company with this name.' });
      }
    }

    // Update the company
    const result = await pool.query(
      `
      UPDATE companies
      SET name = COALESCE(NULLIF($1, ''), name),
          website = COALESCE(NULLIF($2, ''), website),
          location = COALESCE(NULLIF($3, ''), location)
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, website, location;
      `,
      [name?.trim() || null, website?.trim() || null, location?.trim() || null, id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Company not found or you do not have permission to edit it.' });
    }

    return res.json({ company: result.rows[0] });
  } catch (err) {
    console.error('Error updating company:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


export default router;