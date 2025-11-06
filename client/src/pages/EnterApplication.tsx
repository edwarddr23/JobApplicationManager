import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TextInputBox, SelectBox } from '../components/UIComponents';

interface JobBoard {
  id: string;
  name: string;
}

const EnterApplication: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState('applied');
  const [jobBoardId, setJobBoardId] = useState('');
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;

  useEffect(() => {
    if (!token) return;

    fetch('/job-boards', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.job_boards && Array.isArray(data.job_boards)) {
          setJobBoards(data.job_boards);
        } else {
          console.error('Unexpected job boards response:', data);
          setJobBoards([]);
        }
      })
      .catch(err => console.error('Failed to fetch job boards:', err));
  }, [token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!companyName || !jobTitle || !status || !jobBoardId) {
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
          jobTitle,
          jobBoardId,
          status,
        }),
      });
      
      if (res.ok) {
        navigate('/');
      } else {
        const data = await res.json();
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

        <TextInputBox
          label="Company Name"
          type="text"
          value={companyName}
          onChange={setCompanyName}
          required
        />

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
