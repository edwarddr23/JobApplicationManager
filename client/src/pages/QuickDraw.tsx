import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TextInputBox, SelectBox } from '../components/UIComponents';
import { FaCopy } from "react-icons/fa";

interface TagValue {
  id: string;
  tag: string;
  value: string;
  type: 'text' | 'link';
}

const QuickDraw: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [rows, setRows] = useState<TagValue[]>([]);
  const [tag, setTag] = useState('');
  const [type, setType] = useState<'text' | 'link'>('text');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTag, setEditTag] = useState('');
  const [editType, setEditType] = useState<'text' | 'link'>('text');
  const [editValue, setEditValue] = useState('');
  const [clickedId, setClickedId] = useState<string | null>(null);

  // -------- Load (initial only) --------
  const load = useCallback(async () => {
    if (!token) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/tagvalues', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to fetch tagvalues');
      }

      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // -------- Add tagvalue (no reload) --------
  const add = async () => {
    if (!tag.trim() || !value.trim()) {
      setError('Tag and value are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/tagvalues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tag: tag.trim(), type, value }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to create tag.');
      }

      const created: TagValue = await res.json();
      setRows(prev => [...prev, created]);

      setTag('');
      setValue('');
      setType('text');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------- Edit / Delete --------
  const startEdit = (row: TagValue) => {
    setEditingId(row.id);
    setEditTag(row.tag);
    setEditType(row.type);
    setEditValue(row.value);
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/tagvalues/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tag: editTag.trim(),
          type: editType,
          value: editValue.trim(),
        }),
      });

      if (!res.ok) {
        const d = await res.text().catch(() => '');
        throw new Error(d || 'Failed to update tag.');
      }

      setRows(prev =>
        prev.map(r =>
          r.id === id ? { ...r, tag: editTag.trim(), type: editType, value: editValue.trim() } : r
        )
      );

      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => setEditingId(null);

  const delRow = async (id: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/tagvalues/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to delete tag.');
      }

      setRows(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------- UI --------
  return (
    <div style={{ padding: 16 }}>
      <h1>Quick Draw</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Inputs */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <TextInputBox label="Tag" type="text" value={tag} onChange={setTag} required />
        <SelectBox
          label="Type"
          value={type}
          onChange={v => setType(v as 'text' | 'link')}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'link', label: 'Link' },
          ]}
          required
        />
        <TextInputBox label="Value" type="text" value={value} onChange={setValue} required />
        <button onClick={add} disabled={loading}>
          Add
        </button>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Tag</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Type</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Value</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Copy</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const isEditing = editingId === r.id;
              return (
                <tr key={r.id}>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <input type="text" value={editTag} onChange={e => setEditTag(e.target.value)} />
                    ) : (
                      <code>{r.tag}</code>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <select value={editType} onChange={e => setEditType(e.target.value as 'text' | 'link')}>
                        <option value="text">Text</option>
                        <option value="link">Link</option>
                      </select>
                    ) : (
                      r.type
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} />
                    ) : r.type === 'link' ? (
                      <a
                        href={r.value.startsWith('http') ? r.value : `https://${r.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'blue', textDecoration: 'underline' }}
                      >
                        {r.value}
                      </a>
                    ) : (
                      <span>{r.value}</span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(r.value);
                        setClickedId(r.id); // invert animation
                        setToastMessage("Saved to clipboard!"); // show toast
                        setTimeout(() => setClickedId(null), 300); // revert button color
                        setTimeout(() => setToastMessage(null), 2000); // hide toast after 2s
                      }}
                      title="Copy value"
                      style={{
                        background: clickedId === r.id ? 'black' : 'white',
                        color: clickedId === r.id ? 'white' : 'black',
                        border: '1px solid black',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {FaCopy({})}
                    </button>

                  </td>
                  <td style={{ padding: 8 }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(r.id)} disabled={loading}>
                          Save
                        </button>
                        <button onClick={cancelEdit} disabled={loading}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(r)} disabled={loading}>
                          Edit
                        </button>
                        <button onClick={() => delRow(r.id)} disabled={loading}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'black',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 8,
            boxShadow: '0px 2px 10px rgba(0,0,0,0.3)',
            opacity: 0.9,
            pointerEvents: 'none',
            zIndex: 1000,
            transition: 'all 0.3s ease',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default QuickDraw;
