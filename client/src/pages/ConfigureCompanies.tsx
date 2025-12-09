import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Company {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  userAdded: boolean; // true if added by this user
}

const ConfigureCompanies: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [newName, setNewName] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // ---------------- Load companies ----------------
  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`GET /companies ${res.status}`);
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------- Add company ----------------
  const addCompany = async () => {
    if (!newName.trim()) {
      setError('Company name cannot be empty');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          website: newWebsite.trim() || null,
          location: newLocation.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error(data.message || 'Company already exists');
        }
        throw new Error(data.error || `Failed to add company (status ${res.status})`);
      }

      const created = await res.json();
      setCompanies(prev => [
        ...prev,
        {
          id: created.companyId,
          name: newName.trim(),
          website: newWebsite.trim() || null,
          location: newLocation.trim() || null,
          userAdded: true,
        },
      ]);

      setNewName('');
      setNewWebsite('');
      setNewLocation('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Delete company ----------------
  const delCompany = async (id: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/companies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete company');
      }

      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Edit company ----------------
  const startEdit = (c: Company) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditWebsite(c.website || '');
    setEditLocation(c.location || '');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim() && !editWebsite.trim() && !editLocation.trim()) {
        setError('Name, website, or location must be provided');
        return;
    }

    setError(null);
    setLoading(true);

    try {
        const res = await fetch(`/companies/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            name: editName.trim(),
            website: editWebsite.trim() || null,
            location: editLocation.trim() || null,
        }),
        });

        if (res.ok) {
        const updated = await res.json();
        setCompanies(prev =>
            prev.map(c =>
            c.id === id
                ? {
                    ...c,
                    name: updated.company.name,
                    website: updated.company.website,
                    location: updated.company.location,
                }
                : c
            )
        );
        setEditingId(null);
        } else if (res.status === 409) {
        // Handle duplicate name
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'A company with this name already exists.');
        } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed to update company (status ${res.status})`);
        }
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
    };


  const cancelEdit = () => setEditingId(null);

  // ---------------- UI ----------------
  return (
    <div style={{ padding: 16 }}>
      <h2>Configure → Companies</h2>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {/* Add company inputs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="New company name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <input
          placeholder="Website (optional)"
          value={newWebsite}
          onChange={e => setNewWebsite(e.target.value)}
        />
        <input
          placeholder="Location (optional)"
          value={newLocation}
          onChange={e => setNewLocation(e.target.value)}
        />
        <button onClick={addCompany} disabled={loading}>
          Add
        </button>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Companies table */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Name</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Website</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Location</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => {
              const isEditing = editingId === c.id;
              return (
                <tr key={c.id}>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                    ) : (
                      <span>{c.name}</span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editWebsite}
                        onChange={e => setEditWebsite(e.target.value)}
                      />
                    ) : c.website ? (
                      <a
                        href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'blue', textDecoration: 'underline' }}
                      >
                        {c.website}
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editLocation}
                        onChange={e => setEditLocation(e.target.value)}
                      />
                    ) : (
                      <span>{c.location || '—'}</span>
                    )}
                  </td>
                  <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(c.id)} disabled={loading}>
                          Save
                        </button>
                        <button onClick={cancelEdit} disabled={loading}>
                          Cancel
                        </button>
                      </>
                    ) : c.userAdded ? (
                      <>
                        <button onClick={() => startEdit(c)} disabled={loading}>
                          Edit
                        </button>
                        <button onClick={() => delCompany(c.id)} disabled={loading}>
                          Delete
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ConfigureCompanies;
