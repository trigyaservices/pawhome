import test from 'node:test';
import assert from 'node:assert/strict';

test('Adoption Decision Logic - Validation constraints', () => {
  // 1. Rejection requires a non-empty reason
  function validateDecision({ decision, reason }) {
    if (!['accept', 'reject'].includes(decision)) {
      throw new Error('Invalid decision');
    }
    if (decision === 'reject' && (!reason || !reason.trim())) {
      throw new Error('A reason is required when rejecting an adoption application');
    }
    return true;
  }

  assert.throws(
    () => validateDecision({ decision: 'reject', reason: '' }),
    /A reason is required/
  );

  assert.throws(
    () => validateDecision({ decision: 'reject', reason: '   ' }),
    /A reason is required/
  );

  assert.equal(
    validateDecision({ decision: 'reject', reason: 'Housing policy incompatibility' }),
    true
  );

  assert.equal(
    validateDecision({ decision: 'accept' }),
    true
  );
});

test('Certificate ID Generation Format', () => {
  function generateCertId(year, seq) {
    return `PH-${year}-${String(seq).padStart(4, '0')}`;
  }

  const certId = generateCertId(2026, 31);
  assert.equal(certId, 'PH-2026-0031');
  assert.match(certId, /^PH-2026-\d{4}$/);
});

test('Pet Status Lifecycle Transitions', () => {
  const transitions = {
    Available: ['Reserved'],
    Reserved: ['Available', 'Adopted'],
    Adopted: []
  };

  function canTransition(current, next) {
    return (transitions[current] || []).includes(next);
  }

  assert.equal(canTransition('Available', 'Reserved'), true);
  assert.equal(canTransition('Reserved', 'Adopted'), true);
  assert.equal(canTransition('Reserved', 'Available'), true);
  assert.equal(canTransition('Adopted', 'Available'), false);
});

test('Currency Formatting per region', () => {
  function formatFee(amount, currency) {
    if (!amount || amount === '0') return 'Free';
    const num = Number(amount);
    switch (currency) {
      case 'INR': return `₹${num.toLocaleString('en-IN')}`;
      case 'USD': return `$${num.toLocaleString('en-US')}`;
      case 'EUR': return `€${num.toLocaleString('de-DE')}`;
      case 'GBP': return `£${num.toLocaleString('en-GB')}`;
      case 'CAD': return `$${num.toLocaleString('en-CA')} CAD`;
      default: return `${currency} ${num}`;
    }
  }

  assert.equal(formatFee('1500', 'INR'), '₹1,500');
  assert.equal(formatFee('120', 'USD'), '$120');
  assert.equal(formatFee('60', 'EUR'), '€60');
  assert.equal(formatFee('90', 'GBP'), '£90');
  assert.equal(formatFee('0', 'INR'), 'Free');
});
