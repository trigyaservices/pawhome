import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <section className="block">
      <div className="wrap" style={{ maxWidth: 840 }}>
        <div style={{ marginBottom: 16 }}>
          <Link to="/" className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Back to Home
          </Link>
        </div>

        <div className="panel" style={{ padding: 40, lineHeight: 1.75 }}>
          <h1 style={{ fontSize: 34, marginBottom: 8, color: 'var(--forest)' }}>Privacy Policy</h1>
          <p className="meta" style={{ marginBottom: 24, fontSize: 14 }}>
            Effective Date: October 2026 · Compliant with India DPDP Act 2023 & GDPR
          </p>

          <p>
            At <b>Pawhome</b> ("we", "our", or "platform"), we are deeply dedicated to facilitating ethical pet adoptions while safeguarding the privacy and personal data of adopters, volunteers, and shelter partners across India and international jurisdictions.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            1. Information We Collect
          </h3>
          <p>We collect only the minimum necessary data to verify adoption readiness and ensure animal welfare:</p>
          <ul style={{ paddingLeft: 22, marginTop: 8, color: 'var(--ink)' }}>
            <li><b>Account Information:</b> Name, email address, phone number, and city/country upon account registration.</li>
            <li><b>Adoption Application Data:</b> Housing type (own vs. rent), household composition, daily routine hours at home, and pet care experience.</li>
            <li><b>Verification Proofs:</b> Government-issued identification (Aadhaar, Passport, Driver's License) and landlord/society pet approval letters (for rented housing).</li>
            <li><b>Welfare Follow-up Data:</b> Voluntary monthly health updates, photos, and wellbeing notes.</li>
            <li><b>Technical Logs:</b> IP address, browser type, and essential cookies for session security.</li>
          </ul>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            2. Confidentiality & Security of Verification Documents
          </h3>
          <p>
            Your government ID proofs and landlord letters are stored in <b>private, access-controlled cloud partitions</b>. They are encrypted at rest and in transit. These sensitive documents are <b>never made public</b>, never indexed by search engines, and are accessible solely to verified shelter administrative personnel assigned to your application review.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            3. Purpose of Data Processing
          </h3>
          <p>Your information is used strictly to:</p>
          <ul style={{ paddingLeft: 22, marginTop: 8, color: 'var(--ink)' }}>
            <li>Review and process adoption applications and prevent fraudulent or commercial breeding exploitation.</li>
            <li>Issue cryptographically verifiable digital adoption certificates.</li>
            <li>Send transactional updates regarding application decisions, certificate issuance, and monthly check-ins.</li>
            <li>Maintain a permanent ethical rescue registry for cross-border animal transport health clearances.</li>
          </ul>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            4. Digital Certificate Public Verification
          </h3>
          <p>
            When an adoption is finalized, an adoption certificate ID (e.g. <code>PH-2026-XXXX</code>) is issued. The public verification page at <code>/verify/:certId</code> reveals only the pet name, breed, adoption date, and adopter first name/city to confirm legitimacy while protecting detailed personal identity.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            5. Cookies & Tracking
          </h3>
          <p>
            We use essential cookies strictly required for authentication and session management. Optional analytical cookies are only activated if you explicitly consent via our Cookie Consent Banner. You may withdraw cookie consent at any time.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            6. Your Legal Rights (DPDP / GDPR)
          </h3>
          <p>
            Depending on your location, you have the right to access your personal data, request correction of inaccurate records, request deletion of non-essential records, and withdraw processing consent. Requests can be submitted to our Data Protection Officer.
          </p>

          <h3 style={{ fontSize: 20, marginTop: 24, marginBottom: 8, color: 'var(--forest)' }}>
            7. Contact Our Privacy Officer
          </h3>
          <p>
            If you have questions regarding this Privacy Policy or wish to exercise your statutory privacy rights, please contact:
            <br />
            <b>Email:</b> privacy@pawhome.org · <b>DPO:</b> dpo@pawhome.org
          </p>
        </div>
      </div>
    </section>
  );
}
