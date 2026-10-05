import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Contact() {
  const { showToast } = useToast();
  usePageMeta('Contact Support & Shelter Partners', 'Get in touch with Pawhome shelter coordinators and adoption counselors.');

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please enter your name';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = 'Please provide details in at least 10 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Spam honeypot detection
    if (honeypot.trim()) {
      console.warn('Bot submission blocked.');
      setSubmitted(true);
      showToast('Message sent. We will get back to you shortly.');
      return;
    }

    if (!validate()) {
      showToast('Please correct the errors in the form.');
      return;
    }

    setSubmitted(true);
    showToast('Message sent. We will get back to you shortly.');
  };

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 16 }}>
          <Link to="/" className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Back to Home
          </Link>
        </div>

        <div className="panel" style={{ padding: 36 }}>
          <h1 style={{ fontSize: 32, marginBottom: 8, color: 'var(--forest)' }}>Contact Pawhome</h1>
          <p className="sub">
            Have questions about a pet, want to partner as a rescue shelter, or need post-adoption advice? Send us a message.
          </p>

          {submitted ? (
            <div style={{ background: 'var(--ok-soft)', color: 'var(--ok)', padding: 28, borderRadius: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🐾</div>
              <h3>Thank you for reaching out!</h3>
              <p style={{ marginTop: 6, fontSize: 15 }}>
                Our adoption coordinators will respond to your email at <b>{formData.email}</b> within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Spam Honeypot Field */}
              <input
                type="text"
                name="honeypot_field"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="field">
                <label htmlFor="cName">Your Name *</label>
                <input
                  id="cName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="Riya Sharma"
                  required
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              <div className="field">
                <label htmlFor="cEmail">Email Address *</label>
                <input
                  id="cEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder="name@example.com"
                  required
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>

              <div className="field">
                <label htmlFor="cSubject">Subject</label>
                <input
                  id="cSubject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Inquiry regarding adoption process or partner shelter"
                />
              </div>

              <div className="field">
                <label htmlFor="cMsg">Message *</label>
                <textarea
                  id="cMsg"
                  rows="4"
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (errors.message) setErrors({ ...errors, message: null });
                  }}
                  placeholder="How can our rescue team assist you?"
                  required
                />
                {errors.message && <div className="error-text">{errors.message}</div>}
              </div>

              <button type="submit" className="btn" style={{ width: '100%', marginTop: 8 }}>
                Send message
              </button>
            </form>
          )}

          <div style={{ borderTop: '1px solid var(--line)', marginTop: 28, paddingTop: 20, fontSize: 14, color: 'var(--muted)' }}>
            <p>Direct Support Email: <b>support@pawhome.org</b></p>
            <p style={{ marginTop: 4 }}>Partner Shelters: <b>shelters@pawhome.org</b></p>
          </div>
        </div>
      </div>
    </section>
  );
}
