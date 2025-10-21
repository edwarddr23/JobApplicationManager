import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Application {
  user_id: string;
  username: string;
  company_id: string;
  company_name: string;
  job_board_id: string;
  job_board_name: string;
  job_title: string;
  status: 'applied' | 'offer' | 'rejected' | 'withdrawn';
  applied_at: string;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!token) {
        setError('You must be logged in to view applications.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/applications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data: Application[] = await res.json();
          setApplications(data);
        } else if (res.status === 401) {
          setError('Unauthorized. Please log in again.');
        } else {
          setError('Failed to fetch applications.');
        }
      } catch (err) {
        console.error(err);
        setError('Server error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [token]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (applications.length === 0) return <p>No applications yet!</p>;

  return (
    <div>
      <h1>Your Applications</h1>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Company</th>
            <th>Job Board</th>
            <th>Job Title</th>
            <th>Status</th>
            <th>Applied At</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app, index) => (
            <tr key={index}>
              <td>{app.username}</td>
              <td>{app.company_name}</td>
              <td>{app.job_board_name}</td>
              <td>{app.job_title}</td>
              <td>{app.status}</td>
              <td>{new Date(app.applied_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Home;
