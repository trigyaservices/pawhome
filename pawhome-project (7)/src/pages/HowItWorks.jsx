import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function HowItWorks() {
  usePageMeta('How Adoption Works', 'Learn about Pawhome’s ethical 5-step adoption process from application to verification.');

  const steps = [
    {
      num: '1',
      title: 'Find your companion',
      desc: 'Browse verified rescue pets across India and our international shelter partners. Filter by species, breed, location, and personality.'
    },
    {
      num: '2',
      title: 'Submit your application',
      desc: 'Fill out our 3-minute adoption questionnaire with your living arrangement, pet care experience, and proof of ID.'
    },
    {
      num: '3',
      title: 'Shelter review & interview',
      desc: 'Our shelter coordinators review your home setup, contact references, and schedule a video or in-person greeting within 2 to 3 days.'
    },
    {
      num: '4',
      title: 'Adoption certificate & welcome',
      desc: 'Upon approval, receive your official cryptographically verified digital adoption certificate and take your pet home!'
    },
    {
      num: '5',
      title: 'Ongoing welfare check-ins',
      desc: 'Share a photo and brief update every month from your account dashboard to keep our shelter community connected.'
    }
  ];

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div style={{ marginBottom: 16 }}>
          <Link to="/" className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Back to Home
          </Link>
        </div>

        <div className="head" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ color: 'var(--forest)' }}>How Pet Adoption Works on Pawhome</h1>
            <p>Our transparent 5-step process ensures happy, lifelong matches between pets and families.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          {steps.map((s) => (
            <div key={s.num} className="panel" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'var(--marigold)',
                  color: 'var(--ink)',
                  fontFamily: 'Bricolage Grotesque',
                  fontWeight: 800,
                  fontSize: 22,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0
                }}
              >
                {s.num}
              </div>
              <div>
                <h3 style={{ fontSize: 22, marginBottom: 6, color: 'var(--forest)' }}>{s.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="panel" style={{ textAlign: 'center', background: 'var(--forest)', color: '#fff', marginTop: 36, padding: 36 }}>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>Ready to meet someone special?</h2>
          <p style={{ color: '#cfe3dc', marginBottom: 20, fontSize: 16 }}>
            Hundreds of rescue animals are waiting for a kind soul like you.
          </p>
          <Link to="/" className="btn alt">
            Browse available pets
          </Link>
        </div>
      </div>
    </section>
  );
}
