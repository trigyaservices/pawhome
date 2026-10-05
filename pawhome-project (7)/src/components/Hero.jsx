import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PET_TINTS } from './PetCard';

export default function Hero() {
  const navigate = useNavigate();

  const handleMeetPets = () => {
    const el = document.getElementById('pets');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="hero">
        <div className="wrap">
          <div>
            <h1>Someone is waiting at the gate for you.</h1>
            <p>
              Browse verified pets from ethical rescue partners in India and abroad. Apply online, get a personal review in 2 to 3 days, and receive your official digital adoption certificate.
            </p>
            <div className="cta">
              <button className="btn alt" onClick={handleMeetPets}>
                🐾 Meet the pets
              </button>
              <button className="btn ghost" onClick={() => navigate('/how-it-works')}>
                How adoption works →
              </button>
            </div>
          </div>

          <div className="tags" aria-hidden="true">
            <div className="tag">
              <div className="face" style={{ background: PET_TINTS.dog }}>
                🐕
              </div>
              <b>Bruno</b>
              <span>Mumbai · 2 yrs</span>
            </div>

            <div className="tag">
              <div className="face" style={{ background: PET_TINTS.cat }}>
                🐈
              </div>
              <b>Oscar</b>
              <span>London · 5 yrs</span>
            </div>

            <div className="tag">
              <div className="face" style={{ background: PET_TINTS.rabbit }}>
                🐇
              </div>
              <b>Coco</b>
              <span>Berlin · 8 mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Credibility Bar */}
      <div className="trust-bar">
        <div className="wrap">
          <div className="trust-item">
            <span className="ico">✓</span>
            <span>100% Ethical Rescue Shelters</span>
          </div>
          <div className="trust-item">
            <span className="ico">🩺</span>
            <span>Health Checked & Vaccinated</span>
          </div>
          <div className="trust-item">
            <span className="ico">📜</span>
            <span>Official Verifiable Certificates</span>
          </div>
          <div className="trust-item">
            <span className="ico">🌍</span>
            <span>India & 14 International Destinations</span>
          </div>
        </div>
      </div>
    </>
  );
}
