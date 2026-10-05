import React from 'react';

export default function StatusPill({ status }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();
  let className = 'pill';

  if (['available', 'accepted', 'adopted', 'received', 'ok', 'submitted'].includes(normalized)) {
    className += ' ok';
  } else if (['pending', 'reserved', 'waiting', 'under review', 'due'].includes(normalized)) {
    className += ' pending';
  } else if (['rejected', 'no', 'not approved', 'needs follow-up'].includes(normalized)) {
    className += ' no';
  }

  // Display label formatting
  let displayLabel = status;
  if (normalized === 'waiting') displayLabel = 'Waiting for update';
  if (normalized === 'received') displayLabel = 'Update received';

  return <span className={className}>{displayLabel}</span>;
}
