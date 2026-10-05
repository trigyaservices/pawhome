import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div>
          Pawhome · Ethical Pet Adoptions in India and 14 other countries
        </div>
        <div className="links">
          <Link to="/how-it-works">How it works</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/policy">Adoption policy</Link>
          <Link to="/terms">Terms & conditions</Link>
          <Link to="/privacy">Privacy policy</Link>
        </div>
        <small style={{ color: 'var(--muted)', fontSize: 13 }}>
          © {new Date().getFullYear()} Pawhome Network. Dedicated to caring, ethical pet adoptions worldwide.
        </small>
      </div>
    </footer>
  );
}
