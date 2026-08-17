import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './Feedback';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader label="Loading TaskFlow…" />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
