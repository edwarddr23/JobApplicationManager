import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TextInputBox, SelectBox } from '../components/UIComponents';

interface JobBoard {
  id: string;
  name: string;
  url: string | null;
  isUserAdded: boolean;
}

interface Company {
  id: string;
  name: string;
  userAdded: boolean;
}

const EnterApplication: React.FC = () => {
  // ---------------- Company state ----------------
  const [companyMode, setCompanyMode] = useState<'manual' | 'select'>('manual');
  const [manualCompanyName, setManualCompanyName] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // ---------------- Job board state ----------------
  const [jobBoardMode, setJobBoardMode] = useState<'manual' | 'select'>('select');
  const [manualJobBoardName, setManualJobBoardName] = useState('');
  const [selectedJobBoardId, setSelectedJobBoardId] = useState('');

  // ---------------- Other form fields ----------------
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState('applied');
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;

  if (!token) {
    console.warn('No token found. Please log in.');
  }

  // ---------------- Fetch companies ----------------
  useEffect(() => {
    if (!token) return;

    const fetchCompanies = async () => {
      try {
        const res = await fetch('/companies', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`GET /companies failed: ${res.status}`);
        const data = await res.json();
        setCompanies(Array.isArray(data.companies) ? data.companies : []);
      } catch (err) {
        console.error('Failed to fetch companies:', err);
        setCompanies([]);
      }
    };

    fetchCompanies();
  }, [token]);

  // ---------------- Fetch job boards ----------------
  useEffect(() => {
    if (!token) return;

    const fetchJobBoards = async () => {
      try {
        const res = await fetch('/job-boards', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`GET /job-boards failed: ${res.status}`);
        const data = await res.json();
        setJobBoards(
          Array.isArray(data.job_boards)
            ? data.job_boards.map((jb: any) => ({
                id: jb.id,
                name: jb.name,
                url: jb.url,
                isUserAdded: jb.isUserAdded, // correct name
              }))
            : []
        );
      } catch (err) {
        console.error('Failed to fetch job boards:', err);
        setJobBoards([]);
      }
    };

    fetchJobBoards();
  }, [token]);

  // ---------------- Handle form submit ----------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Determine company info
    const companyName = companyMode === 'manual' ? manualCompanyName.trim() : undefined;
    const companyId = companyMode === 'select' ? selectedCompanyId : undefined;

    // Determine job board info
    const jobBoardName = jobBoardMode === 'manual' ? manualJobBoardName.trim() : undefined;
    const jobBoardId = jobBoardMode === 'select' ? selectedJobBoardId : undefined;

    // Validate required fields
    if (
      (companyMode === 'manual' && !companyName) ||
      (companyMode === 'select' && !companyId) ||
      (jobBoardMode === 'manual' && !jobBoardName) ||
      (jobBoardMode === 'select' && !jobBoardId) ||
      !jobTitle.trim() ||
      !status
    ) {
      setError('All fields are required.');
      return;
    }

    try {
      const res = await fetch('/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: companyMode === 'select' ? selectedCompanyId : null,
          companyName: companyMode === 'manual' ? manualCompanyName.trim() : null,
          jobTitle: jobTitle.trim(),
          jobBoardId: jobBoardMode === 'select' ? selectedJobBoardId : null,
          jobBoardName: jobBoardMode === 'manual' ? manualJobBoardName.trim() : null,
          status,
        })
,
      });

      if (res.ok) {
        navigate('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to submit application.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
    }
  };

  // ---------------- UI ----------------
  return (
  <div style={{ maxWidth: 650, margin: "0 auto", padding: 20 }}>
    <h1 style={{ marginBottom: 24 }}>Enter New Application</h1>

    {error && <p style={{ color: "red" }}>{error}</p>}

    <form onSubmit={handleSubmit}>

      {/* -------------------------------------------------- */}
      {/* Company Section */}
      {/* -------------------------------------------------- */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Company</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="companyMode"
              value="select"
              checked={companyMode === "select"}
              onChange={() => setCompanyMode("select")}
            />
            <span style={{ marginLeft: 6 }}>Choose Existing</span>
          </label>

          <label>
            <input
              type="radio"
              name="companyMode"
              value="manual"
              checked={companyMode === "manual"}
              onChange={() => setCompanyMode("manual")}
            />
            <span style={{ marginLeft: 6 }}>Enter Manually</span>
          </label>
        </div>

        {companyMode === "manual" ? (
          <TextInputBox
            label="Company Name"
            type="text"
            value={manualCompanyName}
            onChange={setManualCompanyName}
            required
          />
        ) : (
          <SelectBox
            label="Select Company"
            value={selectedCompanyId}
            onChange={(val) => setSelectedCompanyId(String(val))}
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            required
          />
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* Job Board Section */}
      {/* -------------------------------------------------- */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Job Board</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="jobBoardMode"
              value="select"
              checked={jobBoardMode === "select"}
              onChange={() => setJobBoardMode("select")}
            />
            <span style={{ marginLeft: 6 }}>Choose Existing</span>
          </label>

          <label>
            <input
              type="radio"
              name="jobBoardMode"
              value="manual"
              checked={jobBoardMode === "manual"}
              onChange={() => setJobBoardMode("manual")}
            />
            <span style={{ marginLeft: 6 }}>Enter Manually</span>
          </label>
        </div>

        {jobBoardMode === "manual" ? (
          <TextInputBox
            label="Job Board Name"
            type="text"
            value={manualJobBoardName}
            onChange={setManualJobBoardName}
            required
          />
        ) : (
          <SelectBox
            label="Select Job Board"
            value={selectedJobBoardId}
            onChange={(val) => setSelectedJobBoardId(String(val))}
            options={jobBoards.map((jb) => ({ value: jb.id, label: jb.name }))}
            required
          />
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* Job Information Section */}
      {/* -------------------------------------------------- */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Job Information</h2>

        <TextInputBox
          label="Job Title"
          type="text"
          value={jobTitle}
          onChange={setJobTitle}
          required
        />

        <SelectBox
          label="Application Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "applied", label: "Applied" },
            { value: "offer", label: "Offer" },
            { value: "rejected", label: "Rejected" },
            { value: "withdrawn", label: "Withdrawn" },
          ]}
          required
        />
      </div>

      {/* Submit */}
      <button type="submit" style={{ padding: "8px 16px" }}>
        Submit Application
      </button>
    </form>
  </div>
);
};

export default EnterApplication;
