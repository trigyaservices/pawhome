import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function FAQ() {
  usePageMeta('Frequently Asked Questions', 'Answers to common questions about pet adoption fees, shelter screening, and digital certificates.');

  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'Why is there an adoption fee?',
      a: 'The adoption fee helps cover initial vaccinations, deworming, sterilization, health examinations, and microchipping prior to adoption. 100% of the fee goes directly back to rescue partner medical care.'
    },
    {
      q: 'Can international adopters adopt pets from India or vice versa?',
      a: 'Yes! Pawhome facilitates both domestic adoptions and cross-border adoptions with verified airline pet travel partners and international pet relocation health passports.'
    },
    {
      q: 'Why do I need to upload my ID proof and housing documentation?',
      a: 'To safeguard animal welfare and prevent illegal breeding or abandonment, our verified shelters verify adopter identity and confirm that housing societies or landlords permit pets.'
    },
    {
      q: 'How long does application review take?',
      a: 'Most applications are reviewed and processed within 2 to 3 business days. You will receive email notifications as your application moves through each stage.'
    },
    {
      q: 'What are monthly updates?',
      a: 'Active adopters are prompted once a month to submit a quick photo and health note. This fosters accountability, lets rescue volunteers know the pet is thriving, and connects you to post-adoption behavioral support.'
    },
    {
      q: 'What is the digital certificate of adoption?',
      a: 'Every finalized adoption generates a tamper-evident digital certificate with a unique certificate ID and QR code linking to our public verification portal at /verify/:certId.'
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

        <div className="head" style={{ marginBottom: 28 }}>
          <div>
            <h1 style={{ color: 'var(--forest)' }}>Frequently Asked Questions</h1>
            <p>Everything you need to know about the adoption process, pet welfare, and documentation.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="panel"
                style={{ padding: 22, cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
              >
                <div className="row" style={{ alignItems: 'center' }}>
                  <h3 style={{ fontSize: 18.5, margin: 0, color: 'var(--ink)' }}>{faq.q}</h3>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--forest)', minWidth: 24, textAlign: 'center' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
                {isOpen && (
                  <p style={{ marginTop: 14, color: 'var(--muted)', lineHeight: 1.6, fontSize: 15.5 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
