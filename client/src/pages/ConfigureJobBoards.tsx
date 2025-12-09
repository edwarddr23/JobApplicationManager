import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface JobBoard {
  id: string;
  name: string;
  url: string | null;
  isUserAdded: boolean;
}

const ConfigureJobBoards: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [boards, setBoards] = useState<JobBoard[]>([]);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // Load job boards
  const load = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/job-boards', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`GET /job-boards ${res.status}`);

      const data = await res.json();
      setBoards(data.job_boards || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  // Add new board
  const addBoard = async () => {
  if (!newName.trim()) {
    setError('Job board name cannot be empty');
    return;
  }

  setError(null);
  setLoading(true);

    try {
        const res = await fetch('/job-boards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
        });

        if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
            throw new Error(data.message || 'Job board already exists');
        }
        throw new Error(data.error || 'Failed to add job board');
        }

        const created = await res.json();

        // Add the new board locally without reloading
        setBoards(prev => [
        ...prev,
        {
            id: created.jobBoardId,
            name: newName.trim(),
            isUserAdded: true,
            url: created.url || null,
        },
        ]);

            // Reset input field
            setNewName('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

  // Delete board
  const delBoard = async (id: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/job-boards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete job board');
      }

      setBoards(prev => prev.filter(b => b.id !== id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit board
  const startEdit = (board: JobBoard) => {
    setEditingId(board.id);
    setEditName(board.name);
    setEditUrl(board.url || '');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim() && !editUrl.trim()) {
      setError('Name or URL must be provided');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/job-boards/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          url: editUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update job board');
      }

      const updated = await res.json();

      setBoards(prev =>
        prev.map(b =>
          b.id === id ? { ...b, name: editName.trim(), url: editUrl.trim() || null } : b
        )
      );

      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // UI
  return (
    <div style={{ padding: 16 }}>
      <h2>Configure → Job Boards</h2>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {/* Add new board */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="New job board name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <input
          placeholder="URL (optional)"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
        />
        <button onClick={addBoard} disabled={loading}>
          Add
        </button>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Job boards table */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Name</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>URL</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {boards.map(b => {
              const isEditing = editingId === b.id;

              return (
                <tr key={b.id}>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                    ) : (
                      <span>{b.name}</span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                      />
                    ) : b.url ? (
                      <a
                        href={b.url.startsWith('http') ? b.url : `https://${b.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'blue', textDecoration: 'underline' }}
                      >
                        {b.url}
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(b.id)} disabled={loading}>
                          Save
                        </button>
                        <button onClick={cancelEdit} disabled={loading}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {b.isUserAdded && (
                          <button onClick={() => startEdit(b)} disabled={loading}>
                            Edit
                          </button>
                        )}
                        {b.isUserAdded && (
                          <button onClick={() => delBoard(b.id)} disabled={loading}>
                            Delete
                          </button>
                        )}
                      </>
                    )}
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

export default ConfigureJobBoards;
