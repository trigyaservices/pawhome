import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';

export default function AdminSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    contactEmail: 'adoptions@pawhome.org',
    allowedCountries: 'India, Canada, Germany, United Kingdom, United States',
    allowedCurrencies: 'INR, USD, EUR, GBP, CAD',
    applicationReviewDays: 3,
    monthlyReportDay: 1,
    reminderDay: 8,
    emailTemplates: {
      applicationReceived: 'Thank you for applying to adopt from Pawhome. Your application is under review.',
      applicationAccepted: 'Congratulations! Your adoption application has been approved. Your official certificate is attached.',
      applicationRejected: 'Thank you for your interest. Unfortunately your application could not be approved at this time.'
    }
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const docRef = doc(db, 'settings', 'site');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings((prev) => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const docRef = doc(db, 'settings', 'site');
      await setDoc(docRef, settings, { merge: true });
      showToast('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="head">
          <div>
            <h1>Platform Settings</h1>
            <p>Configure regional boundaries, currencies, contact emails, and email copy.</p>
          </div>
          <Link to="/admin" className="btn sm ghost">
            ← Dashboard
          </Link>
        </div>

        <div className="panel" style={{ padding: 32 }}>
          {loading ? (
            <div style={{ padding: '20px 0' }}>
              <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 120 }} />
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="field">
                <label htmlFor="contactEmail">Official Contact & Notification Email</label>
                <input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  required
                />
                <small className="help-text">Outgoing alerts from Cloud Functions will use this address.</small>
              </div>

              <div className="two">
                <div className="field">
                  <label htmlFor="countries">Supported Countries (comma-separated)</label>
                  <input
                    id="countries"
                    type="text"
                    value={settings.allowedCountries}
                    onChange={(e) => setSettings({ ...settings, allowedCountries: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label htmlFor="currencies">Supported Currencies (comma-separated)</label>
                  <input
                    id="currencies"
                    type="text"
                    value={settings.allowedCurrencies}
                    onChange={(e) => setSettings({ ...settings, allowedCurrencies: e.target.value })}
                  />
                </div>
              </div>

              <div className="two">
                <div className="field">
                  <label htmlFor="reportDay">Monthly Report Trigger Day</label>
                  <input
                    id="reportDay"
                    type="number"
                    min="1"
                    max="28"
                    value={settings.monthlyReportDay}
                    onChange={(e) => setSettings({ ...settings, monthlyReportDay: Number(e.target.value) })}
                  />
                  <small className="help-text">Day of the month when waiting reports are initialized (Default: 1st).</small>
                </div>

                <div className="field">
                  <label htmlFor="reminderDay">Follow-up Auto Reminder Day</label>
                  <input
                    id="reminderDay"
                    type="number"
                    min="1"
                    max="28"
                    value={settings.reminderDay}
                    onChange={(e) => setSettings({ ...settings, reminderDay: Number(e.target.value) })}
                  />
                  <small className="help-text">Day of the month to send automatic reminder emails (Default: 8th).</small>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: 18, marginBottom: 12 }}>Email Template Previews</h3>

                <div className="field">
                  <label htmlFor="tplApplied">Application Received Subject/Body</label>
                  <textarea
                    id="tplApplied"
                    rows="2"
                    value={settings.emailTemplates?.applicationReceived || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailTemplates: {
                          ...settings.emailTemplates,
                          applicationReceived: e.target.value
                        }
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="tplAccepted">Application Accepted Notification</label>
                  <textarea
                    id="tplAccepted"
                    rows="2"
                    value={settings.emailTemplates?.applicationAccepted || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailTemplates: {
                          ...settings.emailTemplates,
                          applicationAccepted: e.target.value
                        }
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="tplRejected">Application Declined Notification</label>
                  <textarea
                    id="tplRejected"
                    rows="2"
                    value={settings.emailTemplates?.applicationRejected || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailTemplates: {
                          ...settings.emailTemplates,
                          applicationRejected: e.target.value
                        }
                      })
                    }
                  />
                </div>
              </div>

              <div className="row" style={{ marginTop: 24 }}>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
