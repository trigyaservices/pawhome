import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Policy() {
  usePageMeta('Adoption Policy & Welfare Standards', 'Pawhome’s ethical adoption regulations, no-kill commitment, and surrender policies.');

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 840 }}>
        <div style={{ marginBottom: 16 }}>
          <Link to="/" className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Back to Home
          </Link>
        </div>

        <div className="panel" style={{ padding: 40, lineHeight: 1.75 }}>
          <h1 style={{ fontSize: 34, marginBottom: 10, color: 'var(--forest)' }}>
            Adoption Policy & Welfare Standards
          </h1>
          <p className="meta" style={{ marginBottom: 24, fontSize: 14 }}>
            Last updated: October 2026 · Ethical Shelter Alliance Guidelines
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            1. No-Kill and Ethical Rescue Commitment
          </h3>
          <p>
            Pawhome partners solely with verified ethical shelters, certified foster networks, and registered animal welfare organizations across India and internationally. We strictly uphold a non-commercial, no-kill philosophy.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            2. Adopter Screening & Safeguards
          </h3>
          <p>
            All applicants must submit government-issued identification and verify that their current residence allows companion animals. In rented accommodations, written landlord approval is mandatory to prevent unlawful animal displacement.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            3. Mandatory Sterilization & Health Clearance
          </h3>
          <p>
            Animals above age-appropriate limits are spayed or neutered prior to adoption. For young puppies or kittens, the adopter enters into a legally binding sterilization agreement upon the animal reaching reproductive maturity.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            4. Post-Adoption Welfare & Monthly Check-Ins
          </h3>
          <p>
            Adopters agree to submit periodic monthly welfare updates through the Pawhome portal. If severe neglect or abandonment concerns arise, rescue partners retain the right of welfare intervention.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            5. Surrender Policy
          </h3>
          <p>
            Should an adopter encounter life circumstances where they can no longer care for the adopted pet, the animal must not be transferred, sold, or abandoned to an open shelter. It must be surrendered back to the designated partner shelter through Pawhome.
          </p>
        </div>
      </div>
    </section>
  );
}
