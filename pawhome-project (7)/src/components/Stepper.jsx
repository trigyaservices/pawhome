import React from 'react';

export default function Stepper({ status }) {
  const norm = String(status || 'Pending').toLowerCase();
  const isAccepted = norm === 'accepted';
  const isRejected = norm === 'rejected';

  // Step indices: 0: Submitted, 1: Under review, 2: Approved/Not approved, 3: Certificate
  const activeIndex = isAccepted ? 3 : isRejected ? 2 : 1;

  const steps = [
    { label: 'Submitted', key: 'sub' },
    { label: 'Under review', key: 'rev' },
    { label: isRejected ? 'Not approved' : 'Approved', key: 'dec' },
    { label: 'Certificate', key: 'cert' }
  ];

  return (
    <div className="steps" aria-label={`Application progress: ${status}`}>
      {steps.map((step, index) => {
        let dotClass = '';
        if (index <= activeIndex) {
          dotClass = isRejected && index === 2 ? 'rejected' : 'on';
        }
        return (
          <React.Fragment key={step.key}>
            <i className={dotClass} />
            <em>{step.label}</em>
          </React.Fragment>
        );
      })}
    </div>
  );
}
