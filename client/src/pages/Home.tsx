import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Application {
    id: string;
    user_id: string;
    username: string;
    company_id: string;
    company_name: string;
    job_board_id: string;
    job_board_name: string;
    job_title: string;
    status: 'applied' | 'offer' | 'rejected' | 'withdrawn';
    applied_at: string;
    last_updated: string;
}

const statuses: ('applied' | 'offer' | 'rejected' | 'withdrawn')[] = [
    'applied', 'offer', 'rejected', 'withdrawn',
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!token) {
        setError('You must be logged in to view applications.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/applications', {
          headers: { Authorization: `Bearer ${token}` },
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

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setNewStatus(applications[index].status);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus(e.target.value);
  };

  const handleSave = async (index: number) => {
    const app = applications[index];
    try {
      const res = await fetch(`/applications/${app.user_id}/${app.company_id}/${app.job_board_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedApplications = [...applications];
        updatedApplications[index].status = newStatus as Application['status'];
        updatedApplications[index].last_updated = new Date().toISOString(); // update locally
        setApplications(updatedApplications);
        setEditingIndex(null);
      } else {
        console.error('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, index: number) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
        const res = await fetch(`/applications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
        const updatedApplications = [...applications];
        updatedApplications.splice(index, 1);
        setApplications(updatedApplications);
        alert('Application deleted.');
        } else {
        const data = await res.json();
        console.error('Failed to delete:', data.error);
        }
    } catch (err) {
        console.error('Error deleting application:', err);
    }
    };

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
                    <th>Last Updated</th> {/* new column */}
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {applications.map((app, index) => (
                    <tr key={index}>
                        <td>{app.username}</td>
                        <td>{app.company_name}</td>
                        <td>{app.job_board_name}</td>
                        <td>{app.job_title}</td>
                        <td>
                            {editingIndex === index ? (
                            <select value={newStatus} onChange={handleStatusChange}>
                                {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                                ))}
                            </select>
                            ) : (
                            app.status
                            )}
                        </td>
                        <td>{new Date(app.applied_at).toLocaleString()}</td>
                        <td>{new Date(app.last_updated).toLocaleString()}</td>
                        <td>
                            {editingIndex === index ? (
                                <button onClick={() => handleSave(index)}>Save</button>
                            ) : (
                                <>
                                <button onClick={() => handleEditClick(index)}>Edit</button>
                                <button onClick={() => handleDelete(app.id, index)}>Delete</button>
                                </>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default Home;
