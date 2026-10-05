import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="top">
      <div className="wrap">
        <Link to="/" className="logo">
          <i>🐾</i>Pawhome
        </Link>

        <nav aria-label="Main Navigation">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/applications" className={({ isActive }) => (isActive ? 'active' : '')}>
                Applications
              </NavLink>
              <NavLink to="/admin/pets" className={({ isActive }) => (isActive ? 'active' : '')}>
                Pets
              </NavLink>
              <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
                Reports
              </NavLink>
              <NavLink to="/admin/adoptions" className={({ isActive }) => (isActive ? 'active' : '')}>
                Adoptions
              </NavLink>
              <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
                View Site
              </NavLink>
              <button className="btn sm ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : user ? (
            <>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Find a pet
              </NavLink>
              <NavLink to="/how-it-works" className={({ isActive }) => (isActive ? 'active' : '')}>
                How it works
              </NavLink>
              <NavLink to="/account" className={({ isActive }) => (isActive ? 'active' : '')}>
                My account
              </NavLink>
              <NotificationBell />
              <button className="btn sm ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Find a pet
              </NavLink>
              <NavLink to="/how-it-works" className={({ isActive }) => (isActive ? 'active' : '')}>
                How it works
              </NavLink>
              <NavLink to="/faq" className={({ isActive }) => (isActive ? 'active' : '')}>
                FAQ
              </NavLink>
              <Link to="/login" className="btn sm ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
