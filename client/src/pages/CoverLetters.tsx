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
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load cover letters');
      }

      const data: { cover_letters?: any[] } = await res.json();
      const coverLetters = Array.isArray(data.cover_letters) ? data.cover_letters : [];

      const mapped = coverLetters.map(cl => ({
        id: cl.id,
        label: cl.name ?? 'Unnamed Cover Letter',
        filename: cl.file_path ? cl.file_path.split('/').pop() ?? '' : '',
      }));

      setRows(mapped);
    } catch (e: any) {
      setError(e.message || 'Failed to load cover letters.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // --------------------------
  // Upload
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
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to upload cover letter');
      }

      setLabel('');
      setFile(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Delete
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
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to delete cover letter');
      }

      await load();
    } catch (e: any) {
      setError(e.message || 'Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Download
  // --------------------------
  const handleDownload = async (id: string, filename: string) => {
    try {
      const res = await fetch(`/cover-letters/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to download file");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "cover_letter.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || "Download failed.");
    }
  };

  // --------------------------
  // Render (TABLE layout)
  // --------------------------
  return (
    <div style={{ padding: 16 }}>
      <h1>Cover Letters</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Upload inputs */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
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

      {/* Table */}
      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p>No cover letters uploaded yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Label</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Filename</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Download</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Delete</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ padding: 8 }}>
                  <strong>{r.label}</strong>
                </td>

                <td style={{ padding: 8 }}>
                  <code>{r.filename}</code>
                </td>

                <td style={{ padding: 8 }}>
                  <button onClick={() => handleDownload(r.id, r.filename)} disabled={loading}>
                    Download
                  </button>
                </td>

                <td style={{ padding: 8 }}>
                  <button onClick={() => handleDelete(r.id)} disabled={loading}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CoverLetters;
