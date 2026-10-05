import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import Stepper from '../components/Stepper';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';
import PetCard, { PET_TINTS, PET_ICONS } from '../components/PetCard';

export default function Account() {
  const { user, profile } = useAuth();
  const { wishlistPets, fetchWishlistPets } = useWishlist();
  const { showToast } = useToast();

  usePageMeta('My Account', 'Track your pet adoption applications, saved wishlist, digital certificates, and monthly updates.');

  const [activeTab, setActiveTab] = useState('apps'); // 'apps', 'wishlist', 'updates'
  const [applications, setApplications] = useState([]);
  const [adoptions, setAdoptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Certificate Modal state
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [activeCert, setActiveCert] = useState(null);

  // Update Submission Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [updateText, setUpdateText] = useState('');
  const [updatePhoto, setUpdatePhoto] = useState(null);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  useEffect(() => {
    async function loadAccountData() {
      if (!user) return;
      try {
        setLoading(true);

        // Fetch applications
        const appsRef = collection(db, 'applications');
        const appsQuery = query(appsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const appsSnap = await getDocs(appsQuery);
        const appsList = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setApplications(appsList);

        // Fetch adoptions
        const adoptionsRef = collection(db, 'adoptions');
        const adoptionsQuery = query(adoptionsRef, where('userId', '==', user.uid));
        const adoptionsSnap = await getDocs(adoptionsQuery);
        const adoptionsList = adoptionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAdoptions(adoptionsList);

        // Fetch monthly reports
        const reportsRef = collection(db, 'reports');
        const reportsQuery = query(reportsRef, where('userId', '==', user.uid), orderBy('month', 'desc'));
        const reportsSnap = await getDocs(reportsQuery);
        const reportsList = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReports(reportsList);
      } catch (err) {
        console.error('Error loading account data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
    fetchWishlistPets();
  }, [user, fetchWishlistPets]);

  // Check for any due reports
  const pendingReport = reports.find((r) => r.status === 'waiting');

  const openCertificate = (app) => {
    const adoption = adoptions.find((ad) => ad.applicationId === app.id || ad.petId === app.petId);
    setActiveCert({
      id: adoption?.certificateId || `PH-${new Date().getFullYear()}-${app.id.slice(0, 4).toUpperCase()}`,
      certificateUrl: adoption?.certificateUrl || null,
      adopterName: app.fullName || profile?.name || user?.displayName || 'Adopter',
      petName: app.petName || 'Pet',
      petType: app.petType || 'dog',
      date: app.decidedAt ? new Date(app.decidedAt.seconds * 1000).toLocaleDateString() : 'Recent',
      place: `${app.city || 'City'}, ${app.country || 'India'}`
    });
    setCertModalOpen(true);
  };

  const openUpdateModal = (report) => {
    setActiveReport(report);
    setUpdateText('');
    setUpdatePhoto(null);
    setReportModalOpen(true);
  };

  const handleSendUpdate = async (e) => {
    e.preventDefault();
    if (!updateText.trim()) {
      showToast('Please enter a few words about how your pet is doing');
      return;
    }

    try {
      setSubmittingUpdate(true);
      let photoUrl = '';

      if (updatePhoto) {
        const photoPath = `reports/${activeReport.id}/photo_${Date.now()}`;
        const photoRef = ref(storage, photoPath);
        await uploadBytes(photoRef, updatePhoto);
        photoUrl = await getDownloadURL(photoRef);
      }

      const reportDocRef = doc(db, 'reports', activeReport.id);
      await updateDoc(reportDocRef, {
        status: 'received',
        text: updateText.trim(),
        photoUrl: photoUrl || '',
        submittedAt: serverTimestamp()
      });

      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === activeReport.id
            ? { ...r, status: 'received', text: updateText.trim(), photoUrl }
            : r
        )
      );

      setReportModalOpen(false);
      showToast('Update sent. Thank you!');
    } catch (err) {
      console.error('Error submitting monthly report:', err);
      showToast('Could not send update. Please try again.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const displayName = profile?.name || user?.displayName || 'Adopter';

  return (
    <section className="block">
      <div className="wrap">
        <div className="head">
          <div>
            <h2>Hi {displayName}</h2>
            <p>Your wishlist, applications, certificates, and pet updates in one place.</p>
          </div>
          <div>
            <Link to="/account/profile" className="btn sm ghost">
              Edit profile
            </Link>
          </div>
        </div>

        {/* Overdue / Due Monthly Update Banner */}
        {pendingReport && (
          <div className="panel" style={{ background: '#FFF6DC', borderColor: '#F0D58A', marginBottom: 24 }}>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 20 }}>
                  {pendingReport.month} update for your pet is due
                </h3>
                <p className="meta" style={{ margin: 0, color: 'var(--ink)' }}>
                  Share a recent photo and a few lines about their health and routine.
                </p>
              </div>
              <button className="btn alt" onClick={() => openUpdateModal(pendingReport)}>
                Send update
              </button>
            </div>
          </div>
        )}

        {/* Account Tabs */}
        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'apps'}
            onClick={() => setActiveTab('apps')}
          >
            My applications ({applications.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'wishlist'}
            onClick={() => {
              setActiveTab('wishlist');
              fetchWishlistPets();
            }}
          >
            My wishlist ({wishlistPets.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'updates'}
            onClick={() => setActiveTab('updates')}
          >
            Monthly updates ({reports.length})
          </button>
        </div>

        {/* Tab 1: Applications */}
        {activeTab === 'apps' && (
          <div className="panel">
            <h3>My applications</h3>
            {loading ? (
              <div style={{ padding: '20px 0' }}>
                <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 60 }} />
              </div>
            ) : applications.length > 0 ? (
              applications.map((app) => {
                const petType = (app.petType || 'dog').toLowerCase();
                const bgTint = PET_TINTS[petType] || PET_TINTS.other;
                const icon = PET_ICONS[petType] || PET_ICONS.other;
                const appliedDate = app.createdAt?.seconds
                  ? new Date(app.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short'
                    })
                  : 'Recent';

                return (
                  <div key={app.id} className="item">
                    <div className="ico" style={{ background: bgTint }}>
                      {icon}
                    </div>
                    <div className="grow">
                      <b>{app.petName || 'Pet'}</b>
                      <small>
                        Applied {appliedDate} · {app.city}, {app.country}
                      </small>
                      <Stepper status={app.status} />
                      {app.status === 'rejected' && app.decisionReason && (
                        <div style={{ fontSize: 13, color: 'var(--coral)', marginTop: 6 }}>
                          Reason: {app.decisionReason}
                        </div>
                      )}
                    </div>

                    <StatusPill status={app.status} />

                    {app.status === 'accepted' && (
                      <button className="btn sm" onClick={() => openCertificate(app)}>
                        View certificate
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty">
                <h3>You have not applied yet</h3>
                <p>Pick a pet from our verified rescue partners and tap Adopt.</p>
                <Link to="/" className="btn alt" style={{ marginTop: 8 }}>
                  Meet the pets
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="panel">
            <h3>My wishlist</h3>
            {wishlistPets.length > 0 ? (
              <div className="grid">
                {wishlistPets.map((p) => (
                  <PetCard key={p.id} pet={p} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <h3>Your wishlist is empty</h3>
                <p>Tap the heart icon on any pet card to save them to your wishlist.</p>
                <Link to="/" className="btn alt" style={{ marginTop: 8 }}>
                  Explore pets
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Monthly Updates */}
        {activeTab === 'updates' && (
          <div className="panel">
            <h3>Monthly pet updates & welfare</h3>
            <p className="meta" style={{ marginBottom: 18 }}>
              Active adopters submit a monthly update with a photo to help ensure pet health and welfare.
            </p>

            {reports.length > 0 ? (
              reports.map((rep) => (
                <div key={rep.id} className="item">
                  <div className="ico" style={{ background: 'var(--mint)' }}>
                    📸
                  </div>
                  <div className="grow">
                    <b>Month: {rep.month}</b>
                    <small>
                      {rep.status === 'received'
                        ? `Submitted on ${
                            rep.submittedAt?.seconds
                              ? new Date(rep.submittedAt.seconds * 1000).toLocaleDateString()
                              : 'Recent'
                          }`
                        : 'Awaiting your update'}
                    </small>
                    {rep.text && (
                      <p style={{ fontSize: 14, color: 'var(--ink)', marginTop: 4 }}>"{rep.text}"</p>
                    )}
                    {rep.adminReply && (
                      <div
                        style={{
                          background: 'var(--mint)',
                          padding: '6px 10px',
                          borderRadius: 8,
                          fontSize: 13,
                          marginTop: 6,
                          color: 'var(--forest)'
                        }}
                      >
                        <b>Pawhome Team:</b> {rep.adminReply}
                      </div>
                    )}
                  </div>

                  <StatusPill status={rep.status} />

                  {rep.status === 'waiting' && (
                    <button className="btn sm alt" onClick={() => openUpdateModal(rep)}>
                      Send update
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="empty">
                <h3>No active monthly updates scheduled yet</h3>
                <p>Once your pet adoption is accepted, monthly welfare check-ins will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      <Modal isOpen={certModalOpen} onClose={() => setCertModalOpen(false)}>
        {activeCert && (
          <>
            <div className="cert">
              <small>Certificate of adoption · {activeCert.id}</small>
              <div className="face">{PET_ICONS[activeCert.petType] || '🐾'}</div>
              <h3>Pawhome</h3>
              <p>This certifies that</p>
              <div className="big">{activeCert.adopterName}</div>
              <p>
                has adopted <b>{activeCert.petName}</b>
              </p>
              <p>
                <small>Adopted · {activeCert.place}</small>
              </p>

              {/* QR Verification Link Box */}
              <div className="qr-box">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    `${window.location.origin}/verify/${activeCert.id}`
                  )}`}
                  alt={`QR verification code for certificate ${activeCert.id}`}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Scan to verify certificate</p>

              <div className="sig-box">
                <span style={{ fontFamily: 'cursive', fontSize: 20, color: 'var(--forest)' }}>
                  Pawhome Directorate
                </span>
                <small>Signed by Pawhome Admin</small>
              </div>
            </div>

            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn ghost" onClick={() => setCertModalOpen(false)}>
                Close
              </button>
              {activeCert.certificateUrl ? (
                <a
                  href={activeCert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  download={`Pawhome-Certificate-${activeCert.id}.pdf`}
                >
                  Download PDF
                </a>
              ) : (
                <button
                  className="btn"
                  onClick={() => {
                    showToast('Certificate downloaded as PDF');
                    window.print();
                  }}
                >
                  Download PDF
                </button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Monthly Report Submission Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={activeReport ? `Monthly update · ${activeReport.month}` : 'Submit update'}
        subtitle="Admin will review this in Monthly updates to verify pet welfare."
      >
        <form onSubmit={handleSendUpdate}>
          <div className="field">
            <label htmlFor="updatePhoto">Recent Photo (optional)</label>
            <input
              id="updatePhoto"
              type="file"
              accept="image/*"
              onChange={(e) => setUpdatePhoto(e.target.files[0] || null)}
            />
          </div>

          <div className="field">
            <label htmlFor="updateText">How is your pet doing? *</label>
            <textarea
              id="updateText"
              rows="4"
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Tell us about their appetite, routine, energy, and overall health this month..."
              required
            />
          </div>

          <div className="row" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setReportModalOpen(false)}
              disabled={submittingUpdate}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={submittingUpdate}>
              {submittingUpdate ? 'Sending update...' : 'Send update'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
