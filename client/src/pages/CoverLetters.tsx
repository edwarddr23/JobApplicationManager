import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CoverLetter {
  id: string;
  label: string;
  filename: string;
}

const CoverLetters: React.FC = () => {
  const [rows, setRows] = useState<CoverLetter[]>([]);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const token = user?.token;

  const load = async () => {
    if (!token) return;
    setError('');

    try {
      setLoading(true);

      const res = await fetch('/cover-letters', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load cover letters');
      }

      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load cover letters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleUpload = async () => {
    if (!label.trim() || !file) {
      setError('Label and PDF file are required.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    setError('');
    try {
      setLoading(true);

      const fd = new FormData();
      fd.append('label', label.trim());
      fd.append('file', file);

      const res = await fetch('/cover-letters', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to upload cover letter');
      }

      setLabel('');
      setFile(null);
      load();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');

    try {
      setLoading(true);

      const res = await fetch(`/cover-letters/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete cover letter');
      }

      load();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Cover Letters</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Label"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        <button onClick={handleUpload} disabled={loading}>
          Upload
        </button>
        <button onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {rows.map(r => (
            <li key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <strong>{r.label}</strong> — {r.filename}
              <button onClick={() => handleDelete(r.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoverLetters;