import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "appdb",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres"
});

app.get("/healthz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** Demo names (kept) */
app.get("/names", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, created_at FROM app.names ORDER BY id DESC"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/names", async (req, res) => {
  const { full_name } = req.body || {};
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: "full_name is required" });
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO app.names (full_name) VALUES ($1) RETURNING id, full_name, created_at",
      [full_name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Status lookup */
app.get("/statuses", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, key, sort_order FROM app.statuses ORDER BY sort_order"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Create application (friendly body) */
app.post("/applications", async (req, res) => {
  const {
    user_email,
    company,
    job_board,
    title,
    url,
    job_type,
    applied_at,
    note
  } = req.body || {};

  if (!user_email || !company || !job_board || !title) {
    return res.status(400).json({
      error: "user_email, company, job_board and title are required"
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const getOrCreate = async (table, col, value, returning = "id", extraCols = {}) => {
      let r = await client.query(
        `SELECT ${returning} FROM app.${table} WHERE ${col} = $1 LIMIT 1`,
        [value]
      );
      if (r.rowCount) return r.rows[0][returning];

      const keys = Object.keys(extraCols);
      const cols = [col, ...keys];
      const vals = [value, ...keys.map(k => extraCols[k])];
      const params = vals.map((_, i) => `$${i + 1}`).join(", ");
      r = await client.query(
        `INSERT INTO app.${table} (${cols.join(", ")}) VALUES (${params}) RETURNING ${returning}`,
        vals
      );
      return r.rows[0][returning];
    };

    const userId = await getOrCreate("users", "email", user_email.toLowerCase().trim());
    const companyId = await getOrCreate("companies", "name", company.trim());
    const jobBoardId = await getOrCreate("job_boards", "name", job_board.trim(), "id", { url: null });

    const jpRes = await client.query(
      `INSERT INTO app.job_postings (company_id, job_board_id, title, url, job_type, posted_at)
       VALUES ($1,$2,$3,$4,$5, now())
       RETURNING id`,
      [companyId, jobBoardId, title.trim(), url || null, job_type || "full_time"]
    );
    const jobPostingId = jpRes.rows[0].id;

    const statusRes = await client.query("SELECT id FROM app.statuses WHERE key = 'applied' LIMIT 1");
    const appliedStatusId = statusRes.rows[0].id;

    const aRes = await client.query(
      `INSERT INTO app.applications
         (user_id, job_posting_id, source_board, current_status_id, applied_at, updated_at)
       VALUES ($1,$2,$3,$4, COALESCE($5, now()), now())
       RETURNING id`,
      [userId, jobPostingId, job_board, appliedStatusId, applied_at || null]
    );
    const applicationId = aRes.rows[0].id;

    await client.query(
      `INSERT INTO app.status_history (application_id, status_id, note, changed_at)
       VALUES ($1,$2,$3, now())`,
      [applicationId, appliedStatusId, note || null]
    );

    await client.query("COMMIT");
    res.status(201).json({ id: applicationId });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

/** List applications (optionally filter by user_email) */
app.get("/applications", async (req, res) => {
  const { user_email } = req.query;
  try {
    const params = [];
    let where = "";
    if (user_email) {
      params.push(String(user_email).toLowerCase().trim());
      where = "WHERE u.email = $" + params.length;
    }

    const { rows } = await pool.query(
      `
      SELECT
        a.id,
        u.email           AS user_email,
        c.name            AS company,
        jp.title          AS title,
        jp.url            AS job_url,
        s.key             AS status,
        a.applied_at,
        a.updated_at
      FROM app.applications a
      JOIN app.users u        ON u.id = a.user_id
      LEFT JOIN app.job_postings jp ON jp.id = a.job_posting_id
      LEFT JOIN app.companies c     ON c.id = jp.company_id
      LEFT JOIN app.statuses s      ON s.id = a.current_status_id
      ${where}
      ORDER BY a.applied_at DESC
      `,
      params
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Update status + history */
app.patch("/applications/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status_key, note } = req.body || {};
  if (!status_key) return res.status(400).json({ error: "status_key is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sr = await client.query("SELECT id FROM app.statuses WHERE key = $1", [status_key]);
    if (!sr.rowCount) throw new Error(`Unknown status_key: ${status_key}`);
    const statusId = sr.rows[0].id;

    const ur = await client.query(
      `UPDATE app.applications
       SET current_status_id = $1, updated_at = now()
       WHERE id = $2
       RETURNING id`,
      [statusId, id]
    );
    if (!ur.rowCount) throw new Error("Application not found");

    await client.query(
      `INSERT INTO app.status_history (application_id, status_id, note, changed_at)
       VALUES ($1,$2,$3, now())`,
      [id, statusId, note || null]
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
