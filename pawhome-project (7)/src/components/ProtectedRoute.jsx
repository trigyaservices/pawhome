import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Checking authentication status..." />;
  }

  if (!user) {
    // Save intended destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
