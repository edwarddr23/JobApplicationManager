import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  // ---------- form state ----------
  const [userEmail, setUserEmail] = useState("demo@example.com");
  const [company, setCompany] = useState("");
  const [jobBoard, setJobBoard] = useState("LinkedIn");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [jobType, setJobType] = useState("full_time");

  // ---------- data ----------
  const [statuses, setStatuses] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const statusByKey = useMemo(
    () => Object.fromEntries(statuses.map(s => [s.key, s])),
    [statuses]
  );

  async function api(path, init) {
    const res = await fetch(`${API_BASE}${path}`, init);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function fetchStatuses() {
    const data = await api("/statuses");
    setStatuses(data);
  }

  async function fetchApps() {
    if (!userEmail.trim()) return;
    const data = await api(`/applications?user_email=${encodeURIComponent(userEmail.trim())}`);
    setApps(data);
  }

  async function createApplication(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await api("/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail.trim(),
          company: company.trim(),
          job_board: jobBoard.trim(),
          title: title.trim(),
          url: url.trim() || null,
          job_type: jobType,
          note: "Created from UI"
        })
      });
      setCompany(""); setTitle(""); setUrl("");
      await fetchApps();
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  async function updateStatus(appId, status_key) {
    setErr(""); setLoading(true);
    try {
      await api(`/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_key, note: "Updated from UI" })
      });
      await fetchApps();
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchStatuses(); }, []);
  useEffect(() => { fetchApps(); }, [userEmail]);

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", fontFamily: "system-ui, Arial" }}>
      <h1 style={{ marginBottom: 0 }}>Job Applications</h1>
      <p style={{ marginTop: 4, color: "#555" }}>Client → API</p>

      <section style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 10 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: "#555" }}>User Email</div>
          <input
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            style={{ width: "100%", padding: "0.6rem 0.8rem" }}
            placeholder="demo@example.com"
          />
        </label>
        <button onClick={fetchApps} disabled={loading}>Load Applications</button>
      </section>

      <section style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Create Application</h2>
        <form onSubmit={createApplication} style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            <div style={{ fontSize: 12, color: "#555" }}>Company</div>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" style={{ width: "100%", padding: "0.6rem 0.8rem" }} />
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#555" }}>Job Board</div>
            <input value={jobBoard} onChange={(e) => setJobBoard(e.target.value)} placeholder="LinkedIn" style={{ width: "100%", padding: "0.6rem 0.8rem" }} />
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#555" }}>Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Engineer" style={{ width: "100%", padding: "0.6rem 0.8rem" }} />
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#555" }}>Job URL</div>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" style={{ width: "100%", padding: "0.6rem 0.8rem" }} />
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#555" }}>Job Type</div>
            <select value={jobType} onChange={(e) => setJobType(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.8rem" }}>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div style={{ alignSelf: "end" }}>
            <button type="submit" disabled={loading || !company || !title}>Create</button>
          </div>
        </form>
      </section>

      {err && <div style={{ background: "#fee", color: "#900", padding: "0.5rem 0.75rem", marginBottom: "1rem", borderRadius: 8 }}>Error: {err}</div>}

      <section>
        <h2 style={{ marginTop: 0 }}>Applications for {userEmail || "—"}</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {apps.map((a) => (
            <li key={a.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.title} — {a.company}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {a.job_url ? <a href={a.job_url} target="_blank" rel="noreferrer">{a.job_url}</a> : "No link"} • Applied {new Date(a.applied_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#555", marginRight: 8 }}>Status</label>
                  <select
                    value={a.status || "applied"}
                    onChange={(e) => updateStatus(a.id, e.target.value)}
                    disabled={loading}
                  >
                    {statuses.map(s => <option key={s.id} value={s.key}>{s.key}</option>)}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {!apps.length && <p>No applications yet.</p>}
      </section>
    </div>
  );
}import React, { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  const [names, setNames] = useState([]);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function fetchNames() {
    setErr(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/names`);
      if (!res.ok) throw new Error(`GET /names failed: ${res.status}`);
      setNames(await res.json());
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function addName(e) {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) return;
    setErr(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/names`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmed }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `POST /names failed: ${res.status}`);
      }
      setFullName(""); await fetchNames();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchNames(); }, []);

  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "system-ui, Arial" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Names PoC</h1>
      <p style={{ marginTop: 0, color: "#555" }}>Client → <code>/names</code> API</p>

      <form onSubmit={addName} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={fullName} onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter full name" aria-label="Full name"
          style={{ flex: 1, padding: "0.6rem 0.8rem", fontSize: "1rem" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "0 1rem" }}>
          {loading ? "Saving..." : "Save"}
        </button>
      </form>

      <button onClick={fetchNames} disabled={loading} style={{ marginBottom: "1rem" }}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {err && <div style={{ background: "#fee", color: "#900", padding: "0.5rem 0.75rem", marginBottom: "1rem" }}>Error: {err}</div>}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {names.map((n) => (
          <li key={n.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
            <div style={{ fontWeight: 600 }}>{n.full_name}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{new Date(n.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>

      {!names.length && !loading && <p>No names yet. Add one above!</p>}
    </div>
  );
}
