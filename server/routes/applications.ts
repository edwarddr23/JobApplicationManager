import express, { Request, Response } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  userId?: number;
}

/* =============================
   Fetch all applications endpoint.
============================= */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.user_id,
        u.username,
        a.company_id,
        c.name AS company_name,
        a.job_board_id,
        jb.name AS job_board_name,
        a.job_title,
        a.status,
        a.applied_at,
        a.last_updated
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN companies c ON a.company_id = c.id
      JOIN job_boards jb ON a.job_board_id = jb.id
      WHERE a.user_id = $1
      ORDER BY a.applied_at DESC
      `,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/* =============================
   Submit (post) application endpoint.
============================= */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
  }

  const { companyName, companyId, jobTitle, jobBoardId, status } = req.body;

  // Validate required fields
  if ((!companyName && !companyId) || !jobTitle || !jobBoardId || !status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    let finalCompanyId = companyId;

    // If user entered company manually, insert it if it doesn't exist
    if (!companyId && companyName) {
      const companyResult = await pool.query(
        'SELECT id FROM companies WHERE name = $1',
        [companyName]
      );

      if (companyResult.rows.length === 0) {
        const insertCompany = await pool.query(
          'INSERT INTO companies (name) VALUES ($1) RETURNING id',
          [companyName]
        );
        finalCompanyId = insertCompany.rows[0].id;
      } else {
        finalCompanyId = companyResult.rows[0].id;
      }
    }

    // Insert the application
    await pool.query(
      `INSERT INTO applications (user_id, company_id, job_board_id, job_title, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.userId, finalCompanyId, jobBoardId, jobTitle, status]
    );

    res.json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Error inserting application:', err);
    res.status(500).json({ error: 'Server error while submitting application' });
  }
});


/* =============================
   Application status update endpoint.
============================= */
router.patch('/:userId/:companyId/:jobBoardId', async (req: Request, res: Response) => {
  const { userId, companyId, jobBoardId } = req.params;
  const { status } = req.body;

  if (!['applied','offer','rejected','withdrawn'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await pool.query(
      `UPDATE applications
       SET status = $1,
           last_updated = now()
       WHERE user_id = $2 AND company_id = $3 AND job_board_id = $4`,
      [status, userId, companyId, jobBoardId]
    );
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* =============================
   Delete application endpoint.
============================= */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting application:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;