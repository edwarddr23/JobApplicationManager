import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CoverLetter {
  id: string;
  label: string;
  filename: string;
}

const CoverLetters: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [rows, setRows] = useState<CoverLetter[]>([]);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --------------------------
  // Load cover letters
  // --------------------------
  const load = useCallback(async () => {
    if (!token) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/cover-letters', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load cover letters');
      }

      const data: { cover_letters?: any[] } = await res.json();

      const coverLetters = Array.isArray(data.cover_letters) ? data.cover_letters : [];

      const mapped: CoverLetter[] = coverLetters.map(cl => ({
        id: cl.id,
        label: cl.name ?? 'Unnamed Cover Letter',
        filename: cl.file_path ? cl.file_path.split('/').pop() ?? '' : '',
      }));

      setRows(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load cover letters.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // --------------------------
  // Upload a cover letter
  // --------------------------
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
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('name', label.trim());
      fd.append('file', file);

      const res = await fetch('/cover-letters', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to upload cover letter');
      }

      setLabel('');
      setFile(null);
      await load();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Delete a cover letter
  // --------------------------
  const handleDelete = async (id: string) => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/cover-letters/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete cover letter');
      }

      await load();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Render
  // --------------------------
  return (
    <div style={{ padding: 20 }}>
      <h1>Cover Letters</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
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
      ) : rows.length === 0 ? (
        <p>No cover letters uploaded yet.</p>
      ) : (
        <ul style={{ paddingLeft: 20 }}>
          {rows.map(r => (
            <li key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <strong>{r.label}</strong>
              <span style={{ opacity: 0.7 }}>({r.filename})</span>
              <button onClick={() => handleDelete(r.id)} disabled={loading}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoverLetters;
