import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await resetPassword(email);
      setSent(true);
      showToast('Password reset link sent to your email');
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMsg('Unable to send password reset email. Check your address and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 460 }}>
        <div className="panel" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>Reset password</h2>
          <p className="sub">We will send a password reset link to your registered email address.</p>

          {sent ? (
            <div style={{ background: '#D9F1E4', color: 'var(--ok)', padding: 18, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>✉️</div>
              <b>Check your inbox</b>
              <p style={{ fontSize: 14, marginTop: 4 }}>
                We've sent password reset instructions to <b>{email}</b>. Follow the link in that email to create a new password.
              </p>
              <div style={{ marginTop: 18 }}>
                <Link to="/login" className="btn sm">
                  Return to Log in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset}>
              {errorMsg && (
                <div style={{ background: '#FBE0D8', color: 'var(--coral)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                  {errorMsg}
                </div>
              )}

              <div className="field">
                <label htmlFor="resetEmail">Email address</label>
                <input
                  id="resetEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <button type="submit" className="btn" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
                {submitting ? 'Sending link...' : 'Send reset link'}
              </button>

              <p className="meta" style={{ textAlign: 'center', marginTop: 20 }}>
                Remember your password?{' '}
                <Link to="/login" style={{ color: 'var(--forest)', fontWeight: 700 }}>
                  Back to Log in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
