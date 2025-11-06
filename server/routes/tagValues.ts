import express, { Request, Response } from 'express';
import { pool } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all tagvalues for the logged-in user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await pool.query(
      'SELECT id, tag, value, type, created_at, updated_at FROM tagvalues WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get tagvalues error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new tagvalue
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  const { tag, value, type } = req.body;

  // Validation
  if (!tag || !value || !['link', 'text'].includes(type)) {
    return res.status(400).json({ error: 'Invalid input. Tag, value, and type are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tagvalues (user_id, tag, value, type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tag, value, type, created_at, updated_at`,
      [req.userId, tag, value, type]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Create tagvalue error:', err);

    if (err.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'Tag already exists for this user.' });
    }

    res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing tagvalue
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { tag, value, type } = req.body;

  if (!tag || !value || !['link', 'text'].includes(type)) {
    return res.status(400).json({ error: 'Invalid input. Tag, value, and type are required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE tagvalues
       SET tag = $1, value = $2, type = $3, updated_at = now()
       WHERE id = $4 AND user_id = $5
       RETURNING id, tag, value, type, created_at, updated_at`,
      [tag, value, type, id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tagvalue not found' });
    }

    // Wrap the response
    res.json({ tagvalue: result.rows[0] });
  } catch (err: any) {
    console.error('Update tagvalue error:', err);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Tag already exists for this user.' });
    }

    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a tagvalue
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tagvalues WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tagvalue not found' });
    }

    res.json({ message: 'Tagvalue deleted successfully' });
  } catch (err) {
    console.error('Delete tagvalue error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;