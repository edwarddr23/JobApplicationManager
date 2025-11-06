import express, { Request, Response } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  userId?: number;
}

/* =============================
   Fetch all job boards endpoint.
============================= */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

  try {
    const result = await pool.query(
      `SELECT id, user_id, name, url
       FROM job_boards
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY name ASC`,
      [req.userId]
    );

    res.json({
      count: result.rowCount,
      job_boards: result.rows.map(row => ({
        id: row.id,
        // true if the job board was added by this user, false if it was a seeded one
        isUserAdded: row.user_id === req.userId,
        name: row.name,
        url: row.url || null,
      }))
    });
  } catch (err) {
    console.error('Error fetching job boards:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/* =============================
   Add job board endpoint.
============================= */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

  const { name, url } = req.body;

  if (!name) return res.status(400).json({ error: 'Job board name is required.' });

  try {
    const existing = await pool.query('SELECT id FROM job_boards WHERE name = $1', [name]);

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: 'Job board already exists',
        jobBoardId: existing.rows[0].id,
        isUserAdded: false
      });
    }

    const insertResult = await pool.query(
      `INSERT INTO job_boards (name, url, user_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, url || null, req.userId]
    );

    res.json({
      message: 'Job board added successfully',
      jobBoardId: insertResult.rows[0].id,
      isUserAdded: true
    });
  } catch (err) {
    console.error('Error adding job board:', err);
    res.status(500).json({ error: 'Server error while adding job board' });
  }
});

/* =============================
   Delete job board endpoint.
============================= */
router.delete('/:jobBoardId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

  const { jobBoardId } = req.params;

  if (!jobBoardId) return res.status(400).json({ error: 'Job board ID is required' });

  try {
    const result = await pool.query(
      'DELETE FROM job_boards WHERE id = $1 AND user_id = $2 RETURNING id',
      [jobBoardId, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Job board not found or not owned by user' });
    }

    res.json({ message: 'Job board removed successfully', jobBoardId: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting job board:', err);
    res.status(500).json({ error: 'Server error while removing job board' });
  }
});

/* =============================
   Edit job board endpoint.
============================= */
router.patch('/:jobBoardId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

  const { jobBoardId } = req.params;
  const { name, url } = req.body;

  if (!name && !url) return res.status(400).json({ error: 'At least one field (name or url) must be provided' });

  try {
    const existing = await pool.query('SELECT * FROM job_boards WHERE id = $1 AND user_id = $2', [jobBoardId, req.userId]);

    if (existing.rowCount === 0) return res.status(404).json({ error: 'Job board not found or not owned by user' });

    const fields: string[] = [];
    const values: any[] = [];
    let counter = 1;

    if (name) { fields.push(`name = $${counter++}`); values.push(name); }
    if (url) { fields.push(`url = $${counter++}`); values.push(url); }

    values.push(jobBoardId, req.userId);

    const updateQuery = `
      UPDATE job_boards
      SET ${fields.join(', ')}
      WHERE id = $${counter++} AND user_id = $${counter}
      RETURNING *;
    `;

    const updated = await pool.query(updateQuery, values);

    res.json({ message: 'Job board updated successfully', jobBoard: updated.rows[0] });
  } catch (err) {
    console.error('Error updating job board:', err);
    res.status(500).json({ error: 'Server error while updating job board' });
  }
});

export default router;