import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TextInputBox, SelectBox } from '../components/UIComponents';

interface JobBoard {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
  userAdded: boolean;
}

const EnterApplication: React.FC = () => {
  const [companyMode, setCompanyMode] = useState<'manual' | 'select'>('manual');
  const [manualCompanyName, setManualCompanyName] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState('applied');
  const [jobBoardId, setJobBoardId] = useState('');
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;

  // Fetch job boards
  useEffect(() => {
    if (!token) return;
    fetch('/job-boards', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.job_boards && Array.isArray(data.job_boards)) setJobBoards(data.job_boards);
        else setJobBoards([]);
      })
      .catch(err => console.error('Failed to fetch job boards:', err));
  }, [token]);

  // Fetch companies
  useEffect(() => {
    if (!token) return;
    fetch('/companies', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.companies && Array.isArray(data.companies)) setCompanies(data.companies);
        else setCompanies([]);
      })
      .catch(err => console.error('Failed to fetch companies:', err));
  }, [token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Determine company info based on mode
    const companyName = companyMode === 'manual' ? manualCompanyName.trim() : undefined;
    const companyId = companyMode === 'select' && selectedCompanyId ? selectedCompanyId : undefined;

    if (
      (companyMode === 'manual' && !companyName) ||
      (companyMode === 'select' && !companyId) ||
      !jobTitle.trim() ||
      !status ||
      !jobBoardId
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
          companyName,
          companyId,
          jobTitle: jobTitle.trim(),
          jobBoardId,
          status,
        }),
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

  return (
    <div>
      <h1>Enter New Application</h1>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ marginBottom: 12 }}>
          <label>
            <input
              type="radio"
              name="companyMode"
              value="manual"
              checked={companyMode === 'manual'}
              onChange={() => setCompanyMode('manual')}
            />
            Enter company manually
          </label>
          <label style={{ marginLeft: 16 }}>
            <input
              type="radio"
              name="companyMode"
              value="select"
              checked={companyMode === 'select'}
              onChange={() => setCompanyMode('select')}
            />
            Select from existing companies
          </label>
        </div>

        {companyMode === 'manual' ? (
          <TextInputBox
            label="Company Name"
            type="text"
            value={manualCompanyName}
            onChange={setManualCompanyName}
            required
          />
        ) : (
          <SelectBox
            label="Company"
            value={selectedCompanyId}
            onChange={val => setSelectedCompanyId(val)} // ensure val is a string
            options={companies.map(c => ({ value: c.id, label: c.name }))}
            required
          />
        )}

        <TextInputBox
          label="Job Title"
          type="text"
          value={jobTitle}
          onChange={setJobTitle}
          required
        />

        <SelectBox
          label="Job Board"
          value={jobBoardId}
          onChange={setJobBoardId}
          options={jobBoards.map(jb => ({ value: jb.id, label: jb.name }))}
          required
        />

        <SelectBox
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'applied', label: 'Applied' },
            { value: 'offer', label: 'Offer' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'withdrawn', label: 'Withdrawn' },
          ]}
          required
        />

        <button type="submit">Submit Application</button>
      </form>
    </div>
  );
};

export default EnterApplication;
