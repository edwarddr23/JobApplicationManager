import React, { useEffect, useState } from "react";
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
