import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { validateEmail, validatePassword, validateFullName, validatePhone } from '../utils/validation';
import { getSafeErrorMessage } from '../utils/errorHandler';

export default function Signup() {
  usePageMeta('Create Account', 'Register an adopter account on Pawhome to apply and track pet adoptions.');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    country: 'India'
  });
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { signup, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Bot detection
    if (honeypot.trim()) {
      showToast('Account created successfully');
      navigate('/');
      return;
    }

    const nameErr = validateFullName(formData.name);
    if (nameErr) {
      setErrorMsg(nameErr);
      return;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setErrorMsg(emailErr);
      return;
    }

    const passErr = validatePassword(formData.password, 6);
    if (passErr) {
      setErrorMsg(passErr);
      return;
    }

    if (formData.phone) {
      const phoneErr = validatePhone(formData.phone, false);
      if (phoneErr) {
        setErrorMsg(phoneErr);
        return;
      }
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await signup(formData.email.trim(), formData.password, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        country: formData.country
      });
      showToast('Account created successfully! Welcome to Pawhome.');
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(getSafeErrorMessage(err, 'Unable to create account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      await loginWithGoogle();
      showToast('Signed up with Google');
      navigate('/');
    } catch (err) {
      console.error('Google sign-up error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(getSafeErrorMessage(err, 'Google sign-up failed. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div className="panel" style={{ padding: 34 }}>
          {/* Quick Tab Switcher between Log In and Sign Up */}
          <div className="tabs" style={{ justifyContent: 'center', marginBottom: 20 }}>
            <Link to="/login" style={{ flex: 1, textAlign: 'center' }}>
              Log In
            </Link>
            <Link to="/signup" className="active" style={{ flex: 1, textAlign: 'center' }}>
              Sign Up
            </Link>
          </div>

          <h2 style={{ fontSize: 26, marginBottom: 8, color: 'var(--forest)' }}>Create your account</h2>
          <p className="sub">Join Pawhome to apply for adoptions, save wishlists, and track updates.</p>

          {errorMsg && (
            <div style={{ background: 'var(--coral-soft)', color: 'var(--coral)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            className="btn ghost"
            style={{ width: '100%', marginBottom: 18, gap: 10 }}
            onClick={handleGoogleSignup}
            disabled={submitting}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign up with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0', color: 'var(--muted)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 13 }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          <form onSubmit={handleSignup} noValidate>
            {/* Honeypot field */}
            <input
              type="text"
              name="company_website_url"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none', position: 'absolute', left: '-9999px' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="field">
              <label htmlFor="regName">Full name *</label>
              <input
                id="regName"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Riya Sharma"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="regEmail">Email address *</label>
              <input
                id="regEmail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="regPassword">Password (6+ characters) *</label>
              <input
                id="regPassword"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="regPhone">Phone (optional)</label>
                <input
                  id="regPhone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="field">
                <label htmlFor="regCity">City (optional)</label>
                <input
                  id="regCity"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Pune"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="regCountry">Country</label>
              <select id="regCountry" name="country" value={formData.country} onChange={handleChange}>
                <option value="India">India</option>
                <option value="Canada">Canada</option>
                <option value="Germany">Germany</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Other">Other International</option>
              </select>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: 12 }} disabled={submitting}>
              {submitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="meta" style={{ textAlign: 'center', marginTop: 22, fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--forest)', fontWeight: 800 }}>
              Log in here →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
