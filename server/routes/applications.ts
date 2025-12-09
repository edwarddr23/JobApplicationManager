import express from 'express';
import { pool } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/* =============================
   Fetch all applications endpoint.
============================= */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
        COALESCE(c.name, a.custom_company_name) AS company_name,
        a.job_board_id,
        jb.name AS job_board_name,
        a.job_title,
        a.status,
        a.applied_at,
        a.last_updated
      FROM applications a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN companies c ON a.company_id = c.id
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
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { companyId, companyName, jobTitle, jobBoardId, jobBoardName, status } = req.body;

  if (!jobTitle || !status) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!companyId && (!companyName || companyName.trim() === '')) {
    return res.status(400).json({ error: 'You must provide a company.' });
  }

  if (!jobBoardId && (!jobBoardName || jobBoardName.trim() === '')) {
    return res.status(400).json({ error: 'You must provide a job board.' });
  }

  try {
    // ---------------- Handle manual company ----------------
    let finalCompanyId = companyId || null;

    if (!finalCompanyId && companyName) {
      const result = await pool.query(
        `INSERT INTO companies (user_id, name) VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [req.userId, companyName.trim()]
      );
      finalCompanyId = result.rows[0].id;
    }

    // ---------------- Handle manual job board ----------------
    let finalJobBoardId = jobBoardId || null;

    if (!finalJobBoardId && jobBoardName) {
      const result = await pool.query(
        `INSERT INTO job_boards (user_id, name) VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [req.userId, jobBoardName.trim()]
      );
      finalJobBoardId = result.rows[0].id;
    }

    // ---------------- Insert application ----------------
    const insertApp = await pool.query(
      `INSERT INTO applications (user_id, company_id, custom_company_name, job_title, job_board_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        req.userId,
        finalCompanyId,
        companyId ? null : companyName.trim(),
        jobTitle.trim(),
        finalJobBoardId,
        status,
      ]
    );

    res.json({ application_id: insertApp.rows[0].id });
  } catch (err) {
    console.error('Insert failed:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

/* =============================
   Update application status endpoint.
============================= */
router.patch('/:companyId/:jobBoardId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { companyId, jobBoardId } = req.params;
  const { status } = req.body;

  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!['applied','offer','rejected','withdrawn'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      `UPDATE applications
       SET status = $1, last_updated = now()
       WHERE user_id = $2 AND company_id = $3 AND job_board_id = $4`,
      [status, req.userId, companyId, jobBoardId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* =============================
   Delete application endpoint.
============================= */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

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
