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

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
