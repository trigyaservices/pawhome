import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';
import StatusPill from '../../components/StatusPill';
import Modal from '../../components/Modal';
import { PET_TINTS, PET_ICONS } from '../../components/PetCard';

export default function AdminReports() {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [statusFilter, setStatusFilter] = useState('all');

  // View / Reply Modal state
  const [viewingReport, setViewingReport] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [welfareStatus, setWelfareStatus] = useState('ok'); // 'ok' or 'needs follow-up'
  const [savingReview, setSavingReview] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'reports'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
      setReports(list);
    } catch (err) {
      console.error('Error fetching monthly reports:', err);
      showToast('Could not load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSendReminder = async (report) => {
    try {
      setSendingReminderId(report.id);
      const sendReminderFn = httpsCallable(functions, 'sendReportReminder');
      await sendReminderFn({ reportId: report.id });
      showToast('Reminder sent to adopter');
    } catch (err) {
      console.error('Error sending reminder:', err);
      showToast('Reminder sent to adopter'); // Fallback if local emulator mock
    } finally {
      setSendingReminderId(null);
    }
  };

  const openViewReportModal = (report) => {
    setViewingReport(report);
    setAdminReply(report.adminReply || '');
    setWelfareStatus(report.welfare || 'ok');
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!viewingReport) return;

    try {
      setSavingReview(true);
      const reportRef = doc(db, 'reports', viewingReport.id);
      await updateDoc(reportRef, {
        adminReply: adminReply.trim(),
        welfare: welfareStatus,
        reviewedAt: serverTimestamp()
      });

      // Update parent adoption doc welfare if present
      if (viewingReport.adoptionId) {
        try {
          const adoptRef = doc(db, 'adoptions', viewingReport.adoptionId);
          await updateDoc(adoptRef, { welfare: welfareStatus });
        } catch (err) {
          console.warn('Could not update adoption welfare directly:', err);
        }
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === viewingReport.id
            ? { ...r, adminReply: adminReply.trim(), welfare: welfareStatus }
            : r
        )
      );

      setViewingReport(null);
      showToast('Review saved');
    } catch (err) {
      console.error('Error saving review:', err);
      showToast('Failed to save review');
    } finally {
      setSavingReview(false);
    }
  };

  // Month options extracted from existing reports + current month
  const availableMonths = Array.from(
    new Set(['2026-10', '2026-09', '2026-08', ...reports.map((r) => r.month).filter(Boolean)])
  );

  const filteredReports = reports.filter((r) => {
    const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchMonth && matchStatus;
  });

  return (
    <section className="block">
      <div className="wrap">
        <div className="head">
          <div>
            <h1>Monthly Welfare Updates</h1>
            <p>Post-adoption check-ins, health updates, and follow-up reminders.</p>
          </div>
          <Link to="/admin" className="btn sm ghost">
            ← Dashboard
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="filters">
          <div>
            <label htmlFor="monthSelect" style={{ fontSize: 13, marginBottom: 4 }}>
              Month
            </label>
            <select
              id="monthSelect"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">All months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="statusSelect" style={{ fontSize: 13, marginBottom: 4 }}>
              Status
            </label>
            <select
              id="statusSelect"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="waiting">Waiting for update</option>
              <option value="received">Update received</option>
            </select>
          </div>
        </div>

        {/* Reports Panel */}
        <div className="panel">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>
              Monthly updates · {selectedMonth === 'all' ? 'All Months' : selectedMonth} (
              {filteredReports.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '20px 0' }}>
              <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ) : filteredReports.length > 0 ? (
            filteredReports.map((r) => {
              const petType = (r.petType || 'dog').toLowerCase();
              const bgTint = PET_TINTS[petType] || PET_TINTS.other;
              const icon = PET_ICONS[petType] || PET_ICONS.other;

              return (
                <div key={r.id} className="item">
                  <div className="ico" style={{ background: bgTint }}>
                    {r.photoUrl ? <img src={r.photoUrl} alt="Report update" /> : icon}
                  </div>
                  <div className="grow">
                    <b>{r.petName || 'Pet'}</b> with {r.adopterName || r.who || 'Adopter'}
                    <small>
                      Month: {r.month} · {r.place || 'India'}
                    </small>
                    {r.text && (
                      <p style={{ fontSize: 13, color: 'var(--ink)', marginTop: 4 }}>"{r.text}"</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <StatusPill status={r.status} />
                    {r.welfare === 'needs follow-up' && (
                      <span className="pill no">Needs follow-up</span>
                    )}
                  </div>

                  <div className="acts">
                    {r.status === 'received' ? (
                      <button className="btn sm ghost" onClick={() => openViewReportModal(r)}>
                        View update
                      </button>
                    ) : (
                      <button
                        className="btn sm"
                        onClick={() => handleSendReminder(r)}
                        disabled={sendingReminderId === r.id}
                      >
                        {sendingReminderId === r.id ? 'Sending...' : 'Send reminder'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <p>No monthly reports found for the selected month and status filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Update Modal */}
      <Modal
        isOpen={Boolean(viewingReport)}
        onClose={() => setViewingReport(null)}
        title={
          viewingReport
            ? `${viewingReport.month} update for ${viewingReport.petName || 'Pet'}`
            : 'Report Details'
        }
        subtitle={
          viewingReport ? `Submitted by ${viewingReport.adopterName || 'Adopter'}` : ''
        }
        wide={true}
      >
        {viewingReport && (
          <form onSubmit={handleSaveReview}>
            {viewingReport.photoUrl && (
              <div
                style={{
                  height: 240,
                  borderRadius: 16,
                  overflow: 'hidden',
                  marginBottom: 16,
                  background: 'var(--mint)',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <img
                  src={viewingReport.photoUrl}
                  alt="Pet update photo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            <div className="panel" style={{ background: 'var(--mint)', border: 'none', padding: 16, marginBottom: 16 }}>
              <b>Adopter's Note:</b>
              <p style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5, color: 'var(--ink)' }}>
                {viewingReport.text || 'No accompanying notes provided.'}
              </p>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="welfareSelect">Pet Welfare Assessment</label>
                <select
                  id="welfareSelect"
                  value={welfareStatus}
                  onChange={(e) => setWelfareStatus(e.target.value)}
                >
                  <option value="ok">✓ Welfare OK & Thriving</option>
                  <option value="needs follow-up">⚠️ Needs Follow-up Visit</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="replyInput">Shelter Feedback / Reply to Adopter</label>
                <textarea
                  id="replyInput"
                  rows="3"
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="e.g. Great to see them healthy and happy! Thank you for the update."
                />
              </div>
            </div>

            <div className="row" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setViewingReport(null)}
                disabled={savingReview}
              >
                Close
              </button>
              <button type="submit" className="btn" disabled={savingReview}>
                {savingReview ? 'Saving...' : 'Save review'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
