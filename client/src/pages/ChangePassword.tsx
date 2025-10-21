import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextInputBox } from '../components/UIComponents';
import { useAuth } from '../contexts/AuthContext';

const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('You must be logged in to change your password.');
      return;
    }

    try {
      const res = await fetch('/api/changepassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      if (res.ok) {
        navigate('/');
      } else if (res.status === 400) {
        const data = await res.json();
        setError(data.error || 'Invalid input.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div>
      <h1>Change Password</h1>

      <form onSubmit={handleSubmit}>
        {error && <p>{error}</p>}

        <TextInputBox
          label="New Password"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          required
        />

        <TextInputBox
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
        />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ChangePassword;
