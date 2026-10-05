import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Verifying administrator credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="wrap" style={{ padding: '60px 20px' }}>
        <div className="panel" style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--coral)' }}>Access Restricted</h3>
          <p className="meta" style={{ margin: '12px 0 20px' }}>
            You need administrator credentials to access the Pawhome admin panel.
          </p>
          <a href="/" className="btn">Return to Home</a>
        </div>
      </div>
    );
  }

  return children;
}
