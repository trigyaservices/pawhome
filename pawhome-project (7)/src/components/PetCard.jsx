import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import StatusPill from './StatusPill';

export const PET_TINTS = {
  dog: '#FBE3C3',
  cat: '#DCE7FA',
  rabbit: '#F6DCE8',
  bird: '#D8F0D9',
  other: '#E6EBED'
};

export const PET_ICONS = {
  dog: '🐕',
  cat: '🐈',
  rabbit: '🐇',
  bird: '🦜',
  other: '🐾'
};

export const formatCurrency = (amount, currency = 'INR') => {
  if (!amount && amount !== 0) return 'Free';
  if (typeof amount === 'string' && (amount.startsWith('₹') || amount.startsWith('$') || amount.startsWith('€') || amount.startsWith('£'))) {
    return amount;
  }
  const curr = String(currency).toUpperCase();
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 'Free';

  switch (curr) {
    case 'INR':
      return `₹${num.toLocaleString('en-IN')}`;
    case 'USD':
      return `$${num.toLocaleString('en-US')}`;
    case 'EUR':
      return `€${num.toLocaleString('de-DE')}`;
    case 'GBP':
      return `£${num.toLocaleString('en-GB')}`;
    case 'CAD':
      return `$${num.toLocaleString('en-CA')} CAD`;
    default:
      return `${curr} ${num.toLocaleString()}`;
  }
};

export default function PetCard({ pet }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const petType = (pet.type || 'other').toLowerCase();
  const bgTint = PET_TINTS[petType] || PET_TINTS.other;
  const icon = PET_ICONS[petType] || PET_ICONS.other;
  const liked = isWishlisted(pet.id);
  const primaryPhoto = pet.photos && pet.photos.length > 0 ? pet.photos[0] : null;

  const handleAdoptClick = (e) => {
    e.stopPropagation();
    navigate(`/apply/${pet.id}`);
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    toggleWishlist(pet.id, pet.name);
  };

  const descriptiveAlt = `${pet.name}, a ${pet.ageText || pet.age || 'young'} ${pet.breed || ''} ${pet.type || 'pet'} in ${pet.city}, ${pet.country}`;

  return (
    <article className="card" onClick={() => navigate(`/pets/${pet.id}`)} style={{ cursor: 'pointer' }}>
      <div className="pic" style={{ background: bgTint }}>
        {primaryPhoto ? (
          <img src={primaryPhoto} alt={descriptiveAlt} loading="lazy" />
        ) : (
          <span role="img" aria-label={`${pet.type || 'pet'} icon`}>{icon}</span>
        )}
        <button
          className={`heart ${liked ? 'liked' : ''}`}
          aria-pressed={liked}
          aria-label={`${liked ? 'Remove from' : 'Add to'} wishlist: ${pet.name}`}
          onClick={handleHeartClick}
        >
          {liked ? '♥' : '♡'}
        </button>

        {pet.vaccinated && (
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(2px)',
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ok)',
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            ✓ Vaccinated
          </span>
        )}
      </div>

      <div className="body">
        <div className="row">
          <h3>{pet.name}</h3>
          <StatusPill status={pet.status} />
        </div>

        <p className="meta">
          {pet.breed || 'Mixed'} · {pet.ageText || pet.age || 'Young'}
          <br />
          <span style={{ color: 'var(--muted-light)' }}>
            <span className="pin">📍</span>{pet.city}, {pet.country}
          </span>
        </p>

        <div className="row" style={{ marginTop: 'auto', paddingTop: 8 }}>
          <span className="fee">{formatCurrency(pet.fee, pet.currency)}</span>

          {pet.status === 'Available' ? (
            <button className="btn sm" onClick={handleAdoptClick}>
              Adopt {pet.name}
            </button>
          ) : pet.status === 'Reserved' ? (
            <span className="meta" style={{ margin: 0, fontWeight: 600 }}>Under review</span>
          ) : (
            <span className="meta" style={{ margin: 0 }}>Found a home</span>
          )}
        </div>
      </div>
    </article>
  );
}
