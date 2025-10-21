import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  // If a user is trying to navigate somewhere that's private, redirect them to login
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

interface PublicRouteProps {
  children: ReactNode;
  restricted?: boolean;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children, restricted = false }) => {
  const { user } = useAuth();

  // Logged-in users should not access restricted public pages (like login/create user)
  if (user && restricted) return <Navigate to="/" />;

  return <>{children}</>;
};
