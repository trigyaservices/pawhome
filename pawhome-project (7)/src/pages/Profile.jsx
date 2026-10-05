import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { validateProfile } from '../utils/validation';
import { getSafeErrorMessage } from '../utils/errorHandler';

export default function Profile() {
  usePageMeta('My Profile', 'Update your contact details and home location on Pawhome.');

  const { user, profile, updateProfileData } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    country: 'India'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || user?.displayName || '',
        phone: profile.phone || '',
        city: profile.city || '',
        country: profile.country || 'India'
      });
    }
  }, [profile, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateProfile(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('Please fix the errors in your profile.');
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      await updateProfileData(formData);
      showToast('Profile updated successfully');
      navigate('/account');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast(getSafeErrorMessage(err, 'Could not update profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 540 }}>
        <div style={{ marginBottom: 16 }}>
          <Link to="/account" className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Back to My Account
          </Link>
        </div>

        <div className="panel" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 26, marginBottom: 6, color: 'var(--forest)' }}>Your Profile</h2>
          <p className="sub">Update your contact information for adoption applications.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="text" value={user?.email || ''} disabled />
              <small className="help-text">Email address is linked to your authentication login.</small>
            </div>

            <div className="field">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                required
              />
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            <div className="field">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <div className="error-text">{errors.phone}</div>}
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Pune"
                />
              </div>

              <div className="field">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                >
                  <option value="India">India</option>
                  <option value="Canada">Canada</option>
                  <option value="Germany">Germany</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="row" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => navigate('/account')}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
