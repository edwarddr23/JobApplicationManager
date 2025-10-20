import express from "express";
import cors from "cors";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || "db",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "supersecretlocalpw",
  database: process.env.PGDATABASE || "appdb",
});

const JWT_SECRET = process.env.JWT_SECRET || "devlocal-super-secret-change-me";

let HAS_STATUS_TEXT = false;
let HAS_CURRENT_STATUS_ID = false;
let SH_HAS_TRIPLE = false;
let SH_HAS_APP_ID = false;

async function detectSchema() {
  const appCols = (await pool.query(`
    select column_name from information_schema.columns
    where table_schema='app' and table_name='applications'
  `)).rows.map(r => r.column_name);
  HAS_STATUS_TEXT = appCols.includes("status");
  HAS_CURRENT_STATUS_ID = appCols.includes("current_status_id");

  const shCols = (await pool.query(`
    select column_name from information_schema.columns
    where table_schema='app' and table_name='status_history'
  `)).rows.map(r => r.column_name);
  SH_HAS_TRIPLE = ["user_id","company_id","job_board_id"].every(c => shCols.includes(c));
  SH_HAS_APP_ID = shCols.includes("application_id");
}

async function getStatusId(key) {
  if (!HAS_CURRENT_STATUS_ID) return null;
  const r = await pool.query("select id from app.statuses where key=$1", [key]);
  return r.rowCount ? r.rows[0].id : null;
}
async function getOrCreateUser(username, email) {
  const u1 = await pool.query("select id from app.users where username=$1", [username]);
  if (u1.rowCount) return u1.rows[0].id;
  const u2 = await pool.query(
    "insert into app.users(username, email, password_hash) values($1,$2,$3) returning id",
    [username, email || null, "placeholder"]
  );
  return u2.rows[0].id;
}
async function getOrCreateCompany(name, website, location) {
  const c1 = await pool.query("select id from app.companies where name=$1", [name]);
  if (c1.rowCount) return c1.rows[0].id;
  const c2 = await pool.query(
    "insert into app.companies(name, website, location) values($1,$2,$3) returning id",
    [name, website || null, location || null]
  );
  return c2.rows[0].id;
}
async function getOrCreateJobBoard(name, url) {
  const j1 = await pool.query("select id from app.job_boards where name=$1", [name]);
  if (j1.rowCount) return j1.rows[0].id;
  const j2 = await pool.query(
    "insert into app.job_boards(name, url) values($1,$2) returning id",
    [name, url || null]
  );
  return j2.rows[0].id;
}
async function getApplicationId(user_id, company_id, job_board_id) {
  const r = await pool.query(
    "select id from app.applications where user_id=$1 and company_id=$2 and job_board_id=$3",
    [user_id, company_id, job_board_id]
  );
  return r.rowCount ? r.rows[0].id : null;
}

function signToken(username) {
  return jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: "7d" });
}
function authRequired(req, res, next) {
  const h = req.headers.authorization || "";
  const parts = h.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ error: "missing token" });
  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    req.user = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    const exists = await pool.query("select 1 from app.users where username=$1", [username]);
    if (exists.rowCount) return res.status(409).json({ error: "username already exists" });
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "insert into app.users(username, email, password_hash) values($1,$2,$3)",
      [username, email || null, hash]
    );
    const token = signToken(username);
    res.status(201).json({ username, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    const r = await pool.query("select password_hash from app.users where username=$1", [username]);
    if (!r.rowCount) return res.status(401).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, r.rows[0].password_hash || "");
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    const token = signToken(username);
    res.json({ username, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

app.get("/statuses", async (_req, res) => {
  if (HAS_CURRENT_STATUS_ID) {
    const r = await pool.query("select key from app.statuses order by key");
    return res.json(r.rows.map(x => ({ key: x.key })));
  }
  const list = ["applied","in_review","oa","phone","onsite","offer","rejected","withdrawn"];
  res.json(list.map(k => ({ key: k })));
});

app.post("/applications", authRequired, async (req, res) => {
  try {
    const body = req.body || {};
    const username = body.username || req.user;
    const company = body.company;
    const jobBoard = body.job_board || body.jobBoard;
    const statusKey = body.status || "applied";
    if (!username || !company || !jobBoard) return res.status(400).json({ error: "username, company, job_board required" });

    const user_id = await getOrCreateUser(username, body.email || null);
    const company_id = await getOrCreateCompany(company, body.website || null, body.location || null);
    const job_board_id = await getOrCreateJobBoard(jobBoard, body.url || null);

    if (HAS_STATUS_TEXT) {
      await pool.query(
        `insert into app.applications(user_id, company_id, job_board_id, status)
         values($1,$2,$3,$4)
         on conflict (user_id, company_id, job_board_id)
         do update set status=excluded.status, updated_at=now()`,
        [user_id, company_id, job_board_id, statusKey]
      );
    } else if (HAS_CURRENT_STATUS_ID) {
      const sid = await getStatusId(statusKey);
      if (!sid) return res.status(400).json({ error: "unknown status" });
      await pool.query(
        `insert into app.applications(user_id, company_id, job_board_id, current_status_id)
         values($1,$2,$3,$4)
         on conflict (user_id, company_id, job_board_id)
         do update set current_status_id=excluded.current_status_id, updated_at=now()`,
        [user_id, company_id, job_board_id, sid]
      );
    } else {
      return res.status(500).json({ error: "applications table lacks status columns" });
    }

    try {
      if (SH_HAS_TRIPLE) {
        await pool.query(
          "insert into app.status_history(user_id, company_id, job_board_id, status, note) values($1,$2,$3,$4,$5)",
          [user_id, company_id, job_board_id, statusKey, body.note || "created"]
        );
      } else if (SH_HAS_APP_ID) {
        const app_id = await getApplicationId(user_id, company_id, job_board_id);
        if (app_id) {
          await pool.query(
            "insert into app.status_history(application_id, status, note) values($1,$2,$3)",
            [app_id, statusKey, body.note || "created"]
          );
        }
      }
    } catch {}

    res.status(201).json({ username, company, job_board: jobBoard, status: statusKey });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/applications", async (req, res) => {
  try {
    const username = req.query.username || req.query.user_email;
    if (!username) return res.status(400).json({ error: "username query required" });
    const u = await pool.query("select id from app.users where username=$1", [username]);
    if (!u.rowCount) return res.json([]);
    const user_id = u.rows[0].id;

    if (HAS_STATUS_TEXT) {
      const q = `
        select a.status, a.applied_at, a.updated_at, c.name as company, j.name as job_board
        from app.applications a
        join app.companies c on c.id=a.company_id
        join app.job_boards j on j.id=a.job_board_id
        where a.user_id=$1
        order by a.applied_at desc`;
      const rows = (await pool.query(q, [user_id])).rows.map(r => ({
        username, company: r.company, job_board: r.job_board,
        status: r.status, applied_at: r.applied_at, updated_at: r.updated_at
      }));
      return res.json(rows);
    }

    if (HAS_CURRENT_STATUS_ID) {
      const q = `
        select s.key as status, a.applied_at, a.updated_at, c.name as company, j.name as job_board
        from app.applications a
        join app.companies c on c.id=a.company_id
        join app.job_boards j on j.id=a.job_board_id
        left join app.statuses s on s.id=a.current_status_id
        where a.user_id=$1
        order by a.applied_at desc`;
      const rows = (await pool.query(q, [user_id])).rows.map(r => ({
        username, company: r.company, job_board: r.job_board,
        status: r.status || null, applied_at: r.applied_at, updated_at: r.updated_at
      }));
      return res.json(rows);
    }

    res.status(500).json({ error: "applications table lacks status columns" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/applications/:username/:company/:jobboard/status", authRequired, async (req, res) => {
  const { username, company, jobboard } = req.params;
  const { status, note } = req.body || {};
  if (!status) return res.status(400).json({ error: "status required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const u = await client.query("select id from app.users where username=$1", [username]);
    const c = await client.query("select id from app.companies where name=$1", [company]);
    const j = await client.query("select id from app.job_boards where name=$1", [jobboard]);
    if (!u.rowCount || !c.rowCount || !j.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "user or company or job board not found" });
    }
    const user_id = u.rows[0].id, company_id = c.rows[0].id, job_board_id = j.rows[0].id;

    if (HAS_STATUS_TEXT) {
      const upd = await client.query(
        "update app.applications set status=$4, updated_at=now() where user_id=$1 and company_id=$2 and job_board_id=$3 returning 1",
        [user_id, company_id, job_board_id, status]
      );
      if (!upd.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "application not found" }); }
    } else if (HAS_CURRENT_STATUS_ID) {
      const sid = await getStatusId(status);
      if (!sid) { await client.query("ROLLBACK"); return res.status(400).json({ error: "unknown status" }); }
      const upd = await client.query(
        "update app.applications set current_status_id=$4, updated_at=now() where user_id=$1 and company_id=$2 and job_board_id=$3 returning 1",
        [user_id, company_id, job_board_id, sid]
      );
      if (!upd.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "application not found" }); }
    } else {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "applications table lacks status columns" });
    }

    try {
      if (SH_HAS_TRIPLE) {
        await client.query(
          "insert into app.status_history(user_id, company_id, job_board_id, status, note) values($1,$2,$3,$4,$5)",
          [user_id, company_id, job_board_id, status, note || null]
        );
      } else if (SH_HAS_APP_ID) {
        const app_id = await getApplicationId(user_id, company_id, job_board_id);
        if (app_id) {
          await client.query(
            "insert into app.status_history(application_id, status, note) values($1,$2,$3)",
            [app_id, status, note || null]
          );
        }
      }
    } catch {}

    await client.query("COMMIT");
    res.json({ ok: true, status });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.delete("/applications/:username/:company/:jobboard", authRequired, async (req, res) => {
  const { username, company, jobboard } = req.params;
  try {
    const u = await pool.query("select id from app.users where username=$1", [username]);
    const c = await pool.query("select id from app.companies where name=$1", [company]);
    const j = await pool.query("select id from app.job_boards where name=$1", [jobboard]);
    if (!u.rowCount || !c.rowCount || !j.rowCount) return res.status(404).json({ error: "not found" });
    const user_id = u.rows[0].id, company_id = c.rows[0].id, job_board_id = j.rows[0].id;

    const del = await pool.query(
      "delete from app.applications where user_id=$1 and company_id=$2 and job_board_id=$3",
      [user_id, company_id, job_board_id]
    );
    res.json({ ok: true, deleted: del.rowCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function start() {
  await detectSchema();
  const port = Number(process.env.PORT || 3000);
  app.listen(port, "0.0.0.0", () => {});

app.get("/companies", async (_req, res) => {
  try {
    const r = await pool.query("select id, name, website, location from app.companies order by name");
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/job-boards", async (_req, res) => {
  try {
    const r = await pool.query("select id, name, url from app.job_boards order by name");
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const ACTIVE_APPS_WHERE = "a.deleted_at IS NULL";

const prevGetApps = app._router.stack.find(l => l.route && l.route.path === "/applications" && l.route.methods.get);
if (prevGetApps) { /* noop marker for awareness */ }

app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path === "/applications" && l.route.methods.get));

app.get("/applications", async (req, res) => {
  try {
    const username = req.query.username || req.query.user_email;
    if (!username) return res.status(400).json({ error: "username query required" });
    const u = await pool.query("select id from app.users where username=$1", [username]);
    if (!u.rowCount) return res.json([]);
    const user_id = u.rows[0].id;

    if (HAS_STATUS_TEXT) {
      const q = `
        select a.status, a.applied_at, a.updated_at, c.name as company, j.name as job_board
        from app.applications a
        join app.companies c on c.id=a.company_id
        join app.job_boards j on j.id=a.job_board_id
        where a.user_id=$1 and ${ACTIVE_APPS_WHERE}
        order by a.applied_at desc`;
      const rows = (await pool.query(q, [user_id])).rows.map(r => ({
        username, company: r.company, job_board: r.job_board,
        status: r.status, applied_at: r.applied_at, updated_at: r.updated_at
      }));
      return res.json(rows);
    }

    if (HAS_CURRENT_STATUS_ID) {
      const q = `
        select s.key as status, a.applied_at, a.updated_at, c.name as company, j.name as job_board
        from app.applications a
        join app.companies c on c.id=a.company_id
        join app.job_boards j on j.id=a.job_board_id
        left join app.statuses s on s.id=a.current_status_id
        where a.user_id=$1 and ${ACTIVE_APPS_WHERE}
        order by a.applied_at desc`;
      const rows = (await pool.query(q, [user_id])).rows.map(r => ({
        username, company: r.company, job_board: r.job_board,
        status: r.status || null, applied_at: r.applied_at, updated_at: r.updated_at
      }));
      return res.json(rows);
    }

    res.status(500).json({ error: "applications table lacks status columns" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const prevPatch = app._router.stack.find(l => l.route && l.route.path && l.route.path.endsWith("/status") && l.route.methods.patch);
if (prevPatch) { /* noop */ }

app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path && l.route.path.endsWith("/status") && l.route.methods.patch));

app.patch("/applications/:username/:company/:jobboard/status", authRequired, async (req, res) => {
  const { username, company, jobboard } = req.params;
  const { status, note } = req.body || {};
  if (!status) return res.status(400).json({ error: "status required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const u = await client.query("select id from app.users where username=$1", [username]);
    const c = await client.query("select id from app.companies where name=$1", [company]);
    const j = await client.query("select id from app.job_boards where name=$1", [jobboard]);
    if (!u.rowCount || !c.rowCount || !j.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "user or company or job board not found" });
    }
    const user_id = u.rows[0].id, company_id = c.rows[0].id, job_board_id = j.rows[0].id;

    if (HAS_STATUS_TEXT) {
      const upd = await client.query(
        `update app.applications
         set status=$4, updated_at=now()
         where user_id=$1 and company_id=$2 and job_board_id=$3 and deleted_at is null
         returning 1`,
        [user_id, company_id, job_board_id, status]
      );
      if (!upd.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "application not found" }); }
    } else if (HAS_CURRENT_STATUS_ID) {
      const sid = await getStatusId(status);
      if (!sid) { await client.query("ROLLBACK"); return res.status(400).json({ error: "unknown status" }); }
      const upd = await client.query(
        `update app.applications
         set current_status_id=$4, updated_at=now()
         where user_id=$1 and company_id=$2 and job_board_id=$3 and deleted_at is null
         returning 1`,
        [user_id, company_id, job_board_id, sid]
      );
      if (!upd.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "application not found" }); }
    } else {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "applications table lacks status columns" });
    }

    try {
      if (SH_HAS_TRIPLE) {
        await client.query(
          "insert into app.status_history(user_id, company_id, job_board_id, status, note) values($1,$2,$3,$4,$5)",
          [user_id, company_id, job_board_id, status, note || null]
        );
      } else if (SH_HAS_APP_ID) {
        const app_id = await getApplicationId(user_id, company_id, job_board_id);
        if (app_id) {
          await client.query(
            "insert into app.status_history(application_id, status, note) values($1,$2,$3)",
            [app_id, status, note || null]
          );
        }
      }
    } catch {}

    await client.query("COMMIT");
    res.json({ ok: true, status });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

const prevDelete = app._router.stack.find(l => l.route && l.route.path && l.route.path.endsWith("/applications/:username/:company/:jobboard") && l.route.methods.delete);
if (prevDelete) { /* noop */ }

app._router.stack = app._router.stack.filter(l => !(l.route && l.route.path && l.route.path.endsWith("/applications/:username/:company/:jobboard") && l.route.methods.delete));

app.delete("/applications/:username/:company/:jobboard", authRequired, async (req, res) => {
  const { username, company, jobboard } = req.params;
  try {
    const u = await pool.query("select id from app.users where username=$1", [username]);
    const c = await pool.query("select id from app.companies where name=$1", [company]);
    const j = await pool.query("select id from app.job_boards where name=$1", [jobboard]);
    if (!u.rowCount || !c.rowCount || !j.rowCount) return res.status(404).json({ error: "not found" });
    const user_id = u.rows[0].id, company_id = c.rows[0].id, job_board_id = j.rows[0].id;

    const del = await pool.query(
      "update app.applications set deleted_at=now() where user_id=$1 and company_id=$2 and job_board_id=$3 and deleted_at is null",
      [user_id, company_id, job_board_id]
    );
    res.json({ ok: true, soft_deleted: del.rowCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

  app.listen(port, "0.0.0.0", () => {});
}
start();

app.get("/applications/:username/:company/:jobboard/status-history", async (req, res) => {
  const { username, company, jobboard } = req.params;
  try {
    const u = await pool.query("select id from app.users where username=$1", [username]);
    const c = await pool.query("select id from app.companies where name=$1", [company]);
    const j = await pool.query("select id from app.job_boards where name=$1", [jobboard]);
    if (!u.rowCount || !c.rowCount || !j.rowCount) return res.status(404).json({ error: "not found" });
    const user_id = u.rows[0].id, company_id = c.rows[0].id, job_board_id = j.rows[0].id;

    if (SH_HAS_TRIPLE) {
      const r = await pool.query(
        "select status, note, changed_at from app.status_history where user_id=$1 and company_id=$2 and job_board_id=$3 order by changed_at desc",
        [user_id, company_id, job_board_id]
      );
      return res.json(r.rows);
    }

    if (SH_HAS_APP_ID) {
      const appIdRes = await pool.query(
        "select id from app.applications where user_id=$1 and company_id=$2 and job_board_id=$3",
        [user_id, company_id, job_board_id]
      );
      if (!appIdRes.rowCount) return res.json([]);
      const app_id = appIdRes.rows[0].id;
      const r = await pool.query(
        "select status, note, changed_at from app.status_history where application_id=$1 order by changed_at desc",
        [app_id]
      );
      return res.json(r.rows);
    }

    res.status(500).json({ error: "status_history table has no supported addressing columns" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
