import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import StatusPill from '../../components/StatusPill';

export default function AdminAdoptions() {
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdoptions() {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'adoptions'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.adoptedAt?.seconds || 0) - (a.adoptedAt?.seconds || 0));
        setAdoptions(list);
      } catch (err) {
        console.error('Error fetching adoptions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdoptions();
  }, []);

  return (
    <section className="block">
      <div className="wrap">
        <div className="head">
          <div>
            <h1>Finalized Adoptions</h1>
            <p>Registry of approved adoptions, generated certificates, and current welfare status.</p>
          </div>
          <Link to="/admin" className="btn sm ghost">
            ← Dashboard
          </Link>
        </div>

        <div className="panel">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>All Adoptions ({adoptions.length})</h3>
          </div>

          {loading ? (
            <div style={{ padding: '20px 0' }}>
              <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ) : adoptions.length > 0 ? (
            adoptions.map((ad) => {
              const adoptedDate = ad.adoptedAt?.seconds
                ? new Date(ad.adoptedAt.seconds * 1000).toLocaleDateString()
                : 'Recent';

              return (
                <div key={ad.id} className="item">
                  <div className="ico" style={{ background: '#D9F1E4' }}>
                    🏆
                  </div>
                  <div className="grow">
                    <b>{ad.petName || 'Pet'}</b> adopted by <b>{ad.adopterName || 'Adopter'}</b>
                    <small>
                      Adopted {adoptedDate} · Certificate: <code>{ad.certificateId || ad.id}</code>
                    </small>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="pill ok">Adopted</span>
                    {ad.welfare === 'needs follow-up' && (
                      <span className="pill no">Needs Follow-up</span>
                    )}
                  </div>

                  <div className="acts">
                    {ad.certificateId && (
                      <Link
                        to={`/verify/${ad.certificateId}`}
                        target="_blank"
                        className="btn sm ghost"
                      >
                        Verify Certificate
                      </Link>
                    )}
                    {ad.certificateUrl && (
                      <a
                        href={ad.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn sm"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <p>No finalized adoptions recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
