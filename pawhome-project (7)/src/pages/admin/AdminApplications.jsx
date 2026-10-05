import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';
import { getSafeErrorMessage } from '../../utils/errorHandler';
import StatusPill from '../../components/StatusPill';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PET_TINTS, PET_ICONS } from '../../components/PetCard';

export default function AdminApplications() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'accepted', 'rejected'
  const [loading, setLoading] = useState(true);

  // Form View Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [idProofUrl, setIdProofUrl] = useState('');
  const [landlordUrl, setLandlordUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Confirmation before accepting
  const [confirmAccept, setConfirmAccept] = useState({
    isOpen: false,
    app: null,
    loading: false
  });

  // Reject Dialog state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [appToReject, setAppToReject] = useState(null);
  const [processingDecision, setProcessingDecision] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'applications'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setApplications(list);
    } catch (err) {
      console.error('Error fetching applications:', err);
      showToast(getSafeErrorMessage(err, 'Could not load applications list'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openFormModal = async (app) => {
    setSelectedApp(app);
    setAdminNotes(app.adminNotes || '');
    setIdProofUrl('');
    setLandlordUrl('');

    try {
      if (app.idProofPath) {
        const idRef = ref(storage, app.idProofPath);
        const url = await getDownloadURL(idRef);
        setIdProofUrl(url);
      }
    } catch (err) {
      console.warn('Could not fetch ID proof download URL directly:', err);
    }

    try {
      if (app.landlordPermPath) {
        const landRef = ref(storage, app.landlordPermPath);
        const url = await getDownloadURL(landRef);
        setLandlordUrl(url);
      }
    } catch (err) {
      console.warn('Could not fetch landlord perm URL:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      setSavingNotes(true);
      const appRef = doc(db, 'applications', selectedApp.id);
      await updateDoc(appRef, { adminNotes: adminNotes.trim() });
      setSelectedApp((prev) => ({ ...prev, adminNotes: adminNotes.trim() }));
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, adminNotes: adminNotes.trim() } : a))
      );
      showToast('Admin notes saved');
    } catch (err) {
      console.error('Error saving notes:', err);
      showToast(getSafeErrorMessage(err, 'Failed to save notes'));
    } finally {
      setSavingNotes(false);
    }
  };

  const requestAccept = (app) => {
    setConfirmAccept({
      isOpen: true,
      app,
      loading: false
    });
  };

  const handleConfirmAccept = async () => {
    const app = confirmAccept.app;
    if (!app) return;

    try {
      setConfirmAccept((prev) => ({ ...prev, loading: true }));
      const decideAppFn = httpsCallable(functions, 'decideApplication');
      await decideAppFn({
        applicationId: app.id,
        decision: 'accept'
      });

      const applicantFirstName = (app.fullName || 'Adopter').split(' ')[0];
      showToast(`Accepted. Certificate sent to ${applicantFirstName}`);

      setConfirmAccept({ isOpen: false, app: null, loading: false });
      if (selectedApp?.id === app.id) {
        setSelectedApp(null);
      }
      await fetchApplications();
    } catch (err) {
      console.error('Error accepting application:', err);
      showToast(getSafeErrorMessage(err, 'Error executing adoption approval'));
      setConfirmAccept((prev) => ({ ...prev, loading: false }));
    }
  };

  const openRejectDialog = (app) => {
    setAppToReject(app);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('Rejection reason is required');
      return;
    }

    try {
      setProcessingDecision(true);
      const decideAppFn = httpsCallable(functions, 'decideApplication');
      await decideAppFn({
        applicationId: appToReject.id,
        decision: 'reject',
        reason: rejectReason.trim()
      });

      showToast('Rejected. Applicant will get an email.');
      setRejectModalOpen(false);
      setAppToReject(null);
      if (selectedApp?.id === appToReject.id) {
        setSelectedApp(null);
      }
      await fetchApplications();
    } catch (err) {
      console.error('Error rejecting application:', err);
      showToast(getSafeErrorMessage(err, 'Error executing rejection'));
    } finally {
      setProcessingDecision(false);
    }
  };

  const filteredApps = applications.filter((a) => {
    if (filter === 'all') return true;
    return (a.status || 'pending').toLowerCase() === filter.toLowerCase();
  });

  return (
    <section className="block">
      <div className="wrap">
        <div className="head">
          <div>
            <h1>Adoption Applications</h1>
            <p>Review candidate homes, inspect ID documentation, and make official adoption decisions.</p>
          </div>
          <Link to="/admin" className="btn sm ghost">
            ← Dashboard
          </Link>
        </div>

        {/* Status Filters */}
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All ({applications.length})
          </button>
          <button
            role="tab"
            aria-selected={filter === 'pending'}
            onClick={() => setFilter('pending')}
          >
            Pending ({applications.filter((a) => a.status === 'pending').length})
          </button>
          <button
            role="tab"
            aria-selected={filter === 'accepted'}
            onClick={() => setFilter('accepted')}
          >
            Accepted ({applications.filter((a) => a.status === 'accepted').length})
          </button>
          <button
            role="tab"
            aria-selected={filter === 'rejected'}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({applications.filter((a) => a.status === 'rejected').length})
          </button>
        </div>

        {/* Applications List Panel */}
        <div className="panel">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Applications ({filteredApps.length})</h3>
          </div>

          {loading ? (
            <div style={{ padding: '20px 0' }}>
              <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ) : filteredApps.length > 0 ? (
            filteredApps.map((a) => {
              const petType = (a.petType || 'dog').toLowerCase();
              const bgTint = PET_TINTS[petType] || PET_TINTS.other;
              const icon = PET_ICONS[petType] || PET_ICONS.other;
              const appliedDate = a.createdAt?.seconds
                ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short'
                  })
                : 'Recent';

              return (
                <div key={a.id} className="item">
                  <div className="ico" style={{ background: bgTint }}>
                    {icon}
                  </div>
                  <div className="grow">
                    <b>{a.fullName}</b> wants <b>{a.petName || 'Pet'}</b>
                    <small>
                      {a.city}, {a.country} · applied {appliedDate}
                    </small>
                  </div>

                  <StatusPill status={a.status} />

                  <div className="acts">
                    <button
                      className="btn sm ghost"
                      onClick={() => openFormModal(a)}
                      aria-label={`View application form for ${a.fullName}`}
                    >
                      View form
                    </button>

                    {a.status === 'pending' && (
                      <>
                        <button
                          className="btn sm good"
                          onClick={() => requestAccept(a)}
                          disabled={confirmAccept.loading || processingDecision}
                          aria-label={`Accept application from ${a.fullName}`}
                        >
                          Accept
                        </button>
                        <button
                          className="btn sm bad"
                          onClick={() => openRejectDialog(a)}
                          disabled={confirmAccept.loading || processingDecision}
                          aria-label={`Reject application from ${a.fullName}`}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {a.status === 'accepted' && a.certificateId && (
                      <small style={{ color: 'var(--muted)', fontWeight: 600 }}>
                        Cert: {a.certificateId}
                      </small>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <p>No applications match the selected status.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Full Application Modal */}
      <Modal
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={selectedApp ? `${selectedApp.fullName}’s Application` : 'Application Details'}
        subtitle={selectedApp ? `For ${selectedApp.petName} · ${selectedApp.city}, ${selectedApp.country}` : ''}
        wide={true}
      >
        {selectedApp && (
          <div>
            <div className="panel" style={{ margin: '0 0 18px', background: 'var(--mint)', border: 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <p><b>Contact:</b> {selectedApp.phone || '—'} · {selectedApp.userEmail || '—'}</p>
                <p><b>Home Type:</b> {selectedApp.homeType || 'Apartment'}</p>
                <p><b>Housing Status:</b> {selectedApp.ownershipStatus || 'Own'}</p>
                <p><b>Hours at Home:</b> {selectedApp.dailyHoursAtHome || 8} hrs/day</p>
                <p><b>Other Pets:</b> {selectedApp.otherPets || 'None'}</p>
                <p><b>Experience:</b> {selectedApp.experience || 'Experienced'}</p>
              </div>

              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                <b>Applicant's Reason:</b>
                <p style={{ marginTop: 4, color: 'var(--ink)', lineHeight: 1.5 }}>
                  {selectedApp.reason || 'None provided'}
                </p>
              </div>

              {/* Uploaded Documents */}
              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                <b>Verification Documents:</b>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                  {idProofUrl ? (
                    <a href={idProofUrl} target="_blank" rel="noopener noreferrer" className="btn sm alt">
                      📄 View ID Proof
                    </a>
                  ) : selectedApp.idProofPath ? (
                    <span className="pill info">ID Proof Attached ({selectedApp.idProofPath.split('/').pop()})</span>
                  ) : (
                    <span className="pill no">No ID Uploaded</span>
                  )}

                  {landlordUrl ? (
                    <a href={landlordUrl} target="_blank" rel="noopener noreferrer" className="btn sm ghost">
                      🏢 View Landlord Permission
                    </a>
                  ) : selectedApp.landlordPermPath ? (
                    <span className="pill info">Landlord Perm Attached</span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="field">
              <label htmlFor="notesInput">Internal Shelter Notes</label>
              <textarea
                id="notesInput"
                rows="3"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add private review notes regarding home check, reference interview..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn sm ghost" onClick={handleSaveNotes} disabled={savingNotes}>
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* Decision Buttons */}
            {selectedApp.status === 'pending' ? (
              <div className="row" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn bad"
                  onClick={() => openRejectDialog(selectedApp)}
                  disabled={processingDecision || confirmAccept.loading}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn good"
                  onClick={() => requestAccept(selectedApp)}
                  disabled={processingDecision || confirmAccept.loading}
                >
                  Accept
                </button>
              </div>
            ) : (
              <div className="row" style={{ marginTop: 16 }}>
                <button type="button" className="btn ghost" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
                <StatusPill status={selectedApp.status} />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog before Accepting */}
      <ConfirmDialog
        isOpen={confirmAccept.isOpen}
        title={`Accept Application for ${confirmAccept.app?.petName || 'Pet'}?`}
        message={`Are you sure you want to approve ${confirmAccept.app?.fullName || 'this applicant'}? This will officially finalize the adoption, mark the pet as Adopted, generate the verifiable digital certificate, and email the applicant.`}
        confirmText="Approve Adoption"
        cancelText="Cancel"
        isDestructive={false}
        loading={confirmAccept.loading}
        onConfirm={handleConfirmAccept}
        onCancel={() => setConfirmAccept({ isOpen: false, app: null, loading: false })}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Application"
        subtitle={appToReject ? `Provide reason for declining ${appToReject.fullName}’s application` : ''}
      >
        <form onSubmit={handleConfirmReject}>
          <div className="field">
            <label htmlFor="rejReason">Rejection Reason (will be emailed to applicant) *</label>
            <textarea
              id="rejReason"
              rows="4"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Housing society pet policy conflict, pet not suitable for multiple animals at home..."
              required
            />
          </div>

          <div className="row" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setRejectModalOpen(false)}
              disabled={processingDecision}
            >
              Cancel
            </button>
            <button type="submit" className="btn bad" disabled={processingDecision}>
              {processingDecision ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
