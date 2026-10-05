import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePageMeta } from '../hooks/usePageMeta';

export default function VerifyCertificate() {
  const { certId } = useParams();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState(null);

  usePageMeta(
    certId ? `Verify Certificate: ${certId}` : 'Certificate Verification',
    'Official Pawhome public adoption registry and cryptographic certificate verification portal.'
  );

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        setError(null);

        const adoptionsRef = collection(db, 'adoptions');
        const q = query(adoptionsRef, where('certificateId', '==', certId));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docData = snap.docs[0].data();
          setCertData({
            id: certId,
            ...docData
          });
        } else {
          // If not in adoptions yet, check if matching format like PH-2026-XXXX in applications
          const appsRef = collection(db, 'applications');
          const appSnap = await getDocs(appsRef);
          const matchedApp = appSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .find(
              (a) =>
                a.status === 'accepted' &&
                (a.certificateId === certId ||
                  `PH-${new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.now()).getFullYear()}-${a.id.slice(0, 4).toUpperCase()}` === certId)
            );

          if (matchedApp) {
            setCertData({
              id: certId,
              adopterName: matchedApp.fullName,
              petName: matchedApp.petName,
              petType: matchedApp.petType,
              date: matchedApp.decidedAt
                ? new Date(matchedApp.decidedAt.seconds * 1000).toLocaleDateString()
                : 'Verified',
              place: `${matchedApp.city}, ${matchedApp.country}`
            });
          } else {
            setError('Certificate not found');
          }
        }
      } catch (err) {
        console.error('Error verifying certificate:', err);
        setError('Unable to verify certificate at this moment.');
      } finally {
        setLoading(false);
      }
    }

    if (certId) {
      verify();
    }
  }, [certId]);

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 600 }}>
        {loading ? (
          <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
            <div className="skeleton" style={{ height: 32, width: '50%', margin: '0 auto 16px' }} />
            <p className="meta">Verifying certificate authenticity...</p>
          </div>
        ) : error || !certData ? (
          <div className="panel" style={{ textAlign: 'center', padding: 40, borderColor: 'var(--coral)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ color: 'var(--coral)', marginBottom: 8 }}>Certificate Not Verified</h2>
            <p className="meta" style={{ marginBottom: 20 }}>
              The certificate ID <b>{certId}</b> could not be validated against Pawhome's official adoption registry.
            </p>
            <Link to="/" className="btn alt">
              Return to Pawhome
            </Link>
          </div>
        ) : (
          <div className="panel" style={{ padding: 36, textAlign: 'center', borderColor: 'var(--ok)' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#D9F1E4',
                color: 'var(--ok)',
                fontSize: 32,
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px'
              }}
            >
              ✓
            </div>

            <h2 style={{ fontSize: 28, color: 'var(--forest)', marginBottom: 4 }}>
              Official Adoption Certificate
            </h2>
            <p className="meta" style={{ fontSize: 15, marginBottom: 20 }}>
              Verified record in the Pawhome International Adoption Registry
            </p>

            <div
              style={{
                background: 'var(--mint)',
                borderRadius: 16,
                padding: 24,
                textAlign: 'left',
                margin: '20px 0'
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="row">
                  <span className="meta" style={{ margin: 0 }}>Certificate ID:</span>
                  <b style={{ fontFamily: 'monospace', fontSize: 16 }}>{certData.id}</b>
                </div>
                <div className="row">
                  <span className="meta" style={{ margin: 0 }}>Adopter:</span>
                  <b>{certData.adopterName || 'Verified Adopter'}</b>
                </div>
                <div className="row">
                  <span className="meta" style={{ margin: 0 }}>Pet Name:</span>
                  <b style={{ color: 'var(--forest)' }}>{certData.petName || 'Pet'}</b>
                </div>
                {certData.place && (
                  <div className="row">
                    <span className="meta" style={{ margin: 0 }}>Location:</span>
                    <span>{certData.place}</span>
                  </div>
                )}
                <div className="row">
                  <span className="meta" style={{ margin: 0 }}>Adoption Status:</span>
                  <span className="pill ok">Official & Finalized</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <Link to="/" className="btn">
                Visit Pawhome Pet Adoption
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
