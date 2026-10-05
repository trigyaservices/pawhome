import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta('404 Page Not Found', 'The requested pet adoption page could not be located.');

  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 540, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>🐾</div>
        <h1 style={{ fontSize: 52, color: 'var(--forest)', marginBottom: 8, fontWeight: 800 }}>404</h1>
        <h2 style={{ fontSize: 26, marginBottom: 12, color: 'var(--ink)' }}>Page Not Found</h2>
        <p className="meta" style={{ fontSize: 16, marginBottom: 30, lineHeight: 1.6 }}>
          The page or pet profile you are looking for may have been adopted, moved, or the web address might contain a typo.
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link to="/" className="btn alt">
            Browse All Available Pets
          </Link>
          <Link to="/how-it-works" className="btn ghost">
            How Adoption Works
          </Link>
        </div>
      </div>
    </section>
  );
}
