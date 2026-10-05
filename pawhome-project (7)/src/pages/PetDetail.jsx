import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useWishlist } from '../hooks/useWishlist';
import { usePageMeta } from '../hooks/usePageMeta';
import { PET_TINTS, PET_ICONS, formatCurrency } from '../components/PetCard';
import StatusPill from '../components/StatusPill';

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [error, setError] = useState(null);

  usePageMeta(
    pet ? `${pet.name} – ${pet.breed || pet.type}` : 'Pet Profile',
    pet ? `Adopt ${pet.name}, a ${pet.ageText || ''} ${pet.breed || ''} ${pet.type || 'pet'} in ${pet.city}, ${pet.country}.` : 'View rescue pet details.'
  );

  useEffect(() => {
    async function loadPet() {
      try {
        setLoading(true);
        setError(null);
        const docRef = doc(db, 'pets', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Pet not found');
        } else {
          setPet({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error loading pet details:', err);
        setError('Unable to load pet details. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    loadPet();
  }, [id]);

  if (loading) {
    return (
      <section className="block">
        <div className="wrap">
          <div className="pet-detail">
            <div className="skeleton" style={{ height: 380, borderRadius: 'var(--r-card)' }} />
            <div>
              <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 24 }} />
              <div className="skeleton" style={{ height: 120, width: '100%', marginBottom: 24 }} />
              <div className="skeleton" style={{ height: 48, width: '50%' }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !pet) {
    return (
      <section className="block">
        <div className="wrap">
          <div className="empty">
            <h3>{error || 'Pet not found'}</h3>
            <p>The pet you are looking for might have been removed or the link is incorrect.</p>
            <Link to="/" className="btn alt" style={{ marginTop: 12 }}>
              Browse all pets
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const petType = (pet.type || 'other').toLowerCase();
  const bgTint = PET_TINTS[petType] || PET_TINTS.other;
  const icon = PET_ICONS[petType] || PET_ICONS.other;
  const liked = isWishlisted(pet.id);
  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [];
  const currentPhoto = photos[selectedPhotoIndex] || null;

  return (
    <section className="block">
      <div className="wrap">
        <div style={{ marginBottom: 20 }}>
          <Link to="/" className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            ← Back to all pets
          </Link>
        </div>

        <div className="pet-detail">
          {/* Gallery Column */}
          <div>
            <div className="gallery-main" style={{ background: bgTint, position: 'relative', boxShadow: 'var(--shadow-md)' }}>
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={`${pet.name}, a ${pet.breed || ''} ${pet.type || 'pet'} - photo ${selectedPhotoIndex + 1}`}
                />
              ) : (
                <span style={{ fontSize: 96 }}>{icon}</span>
              )}
            </div>

            {photos.length > 1 && (
              <div className="gallery-thumbs">
                {photos.map((url, idx) => (
                  <button
                    key={idx}
                    className={`gallery-thumb ${selectedPhotoIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img src={url} alt={`${pet.name} photo thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div>
            <div className="row" style={{ alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <h1 style={{ fontSize: 38, marginBottom: 4, color: 'var(--forest)' }}>{pet.name}</h1>
                <p className="meta" style={{ fontSize: 16 }}>
                  {pet.breed || 'Mixed breed'} · <span className="pin">📍</span>{pet.city}, {pet.country}
                </p>
              </div>
              <StatusPill status={pet.status} />
            </div>

            {/* Personality Trait Tags */}
            {pet.traits && pet.traits.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 16px' }}>
                {pet.traits.map((trait) => (
                  <span
                    key={trait}
                    style={{
                      background: 'var(--paper)',
                      border: '1.5px solid var(--line)',
                      color: 'var(--forest)',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 700
                    }}
                  >
                    ✨ {trait}
                  </span>
                ))}
              </div>
            )}

            <div className="detail-specs">
              <div className="spec-box">
                <small>Type</small>
                <b>{pet.type ? pet.type.toUpperCase() : 'PET'}</b>
              </div>
              <div className="spec-box">
                <small>Age</small>
                <b>{pet.ageText || pet.age || 'Unknown'}</b>
              </div>
              <div className="spec-box">
                <small>Gender</small>
                <b>{pet.gender ? pet.gender.toUpperCase() : 'NOT SPECIFIED'}</b>
              </div>
              <div className="spec-box">
                <small>Size</small>
                <b>{pet.size ? pet.size.toUpperCase() : 'MEDIUM'}</b>
              </div>
              <div className="spec-box">
                <small>Vaccination</small>
                <b>{pet.vaccinated ? '✓ Fully Vaccinated' : 'Pending Verification'}</b>
              </div>
              <div className="spec-box">
                <small>Sterilization</small>
                <b>{pet.neutered !== false ? '✓ Spayed / Neutered' : 'Scheduled'}</b>
              </div>
              <div className="spec-box" style={{ gridColumn: 'span 2' }}>
                <small>Adoption Fee</small>
                <b style={{ fontSize: 20, color: 'var(--forest)' }}>
                  {formatCurrency(pet.fee, pet.currency)}
                </b>
              </div>
            </div>

            {/* Description / Nature */}
            <div style={{ margin: '24px 0' }}>
              <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--ink)' }}>About {pet.name}</h3>
              <p style={{ color: 'var(--ink)', lineHeight: 1.65, fontSize: 15.5, whiteSpace: 'pre-line' }}>
                {pet.description ||
                  `${pet.name} is a gentle, sweet ${pet.breed || 'pet'} waiting for a responsible and loving forever home. They get along well with people and enjoy affection.`}
              </p>
            </div>

            {/* Health & Medical Note */}
            <div className="panel" style={{ background: 'var(--mint)', border: '1px solid var(--line)', padding: 18, marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, color: 'var(--forest)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🛡️</span> Pawhome Health & Welfare Guarantee
              </h4>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                Every pet on Pawhome is evaluated by licensed veterinarians. Vaccinations and deworming treatments are verified prior to adoption clearance.
              </p>
            </div>

            {/* Action Row */}
            <div className="row" style={{ gap: 14, justifyContent: 'flex-start' }}>
              {pet.status === 'Available' ? (
                <button
                  className="btn"
                  style={{ padding: '13px 34px', fontSize: 16 }}
                  onClick={() => navigate(`/apply/${pet.id}`)}
                >
                  Adopt {pet.name}
                </button>
              ) : pet.status === 'Reserved' ? (
                <button className="btn ghost" disabled>
                  Application Pending
                </button>
              ) : (
                <button className="btn ghost" disabled>
                  Already Adopted
                </button>
              )}

              <button
                className={`btn ghost ${liked ? 'bad' : ''}`}
                onClick={() => toggleWishlist(pet.id, pet.name)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px' }}
              >
                <span style={{ fontSize: 18 }}>{liked ? '♥' : '♡'}</span>
                <span>{liked ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
