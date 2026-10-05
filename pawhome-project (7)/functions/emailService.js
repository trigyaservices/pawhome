const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY || '';
const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
const emailFrom = process.env.EMAIL_FROM || 'Pawhome Adoptions <adoptions@pawhome.org>';
const appUrl = process.env.APP_URL || 'http://localhost:3000';

let resendClient = null;
if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
}

/**
 * Dispatch an email with fallback to console logging if credentials are not configured
 */
async function sendEmail({ to, subject, html, text, attachments = [] }) {
  if (!to) return;

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: emailFrom,
        to: [to],
        subject,
        html,
        text,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: a.content.toString('base64')
        }))
      });
      console.log(`[Email] Successfully dispatched email via Resend to ${to}:`, response?.data?.id || 'OK');
      return response;
    } catch (err) {
      console.error(`[Email Error] Resend delivery failed for ${to}:`, err);
    }
  } else if (sendgridApiKey) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(sendgridApiKey);
      const msg = {
        to,
        from: emailFrom,
        subject,
        text,
        html,
        attachments: attachments.map((a) => ({
          content: a.content.toString('base64'),
          filename: a.filename,
          type: 'application/pdf',
          disposition: 'attachment'
        }))
      };
      await sgMail.send(msg);
      console.log(`[Email] Successfully dispatched email via SendGrid to ${to}`);
      return { success: true };
    } catch (err) {
      console.error(`[Email Error] SendGrid delivery failed for ${to}:`, err);
    }
  }

  // Simulator / Development fallback log
  console.log(`\n================= SIMULATED OUTGOING EMAIL =================`);
  console.log(`To: ${to}`);
  console.log(`From: ${emailFrom}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body (Text): ${text || html.replace(/<[^>]+>/g, ' ').slice(0, 200)}...`);
  if (attachments.length > 0) {
    console.log(`Attachments: ${attachments.map((a) => a.filename).join(', ')}`);
  }
  console.log(`============================================================\n`);
  return { simulated: true };
}

function baseEmailTemplate({ title, message, actionText, actionUrl, footerNote }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #EEF5F1; margin: 0; padding: 24px; color: #14312D; }
    .card { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; padding: 32px; border: 1px solid #D3E1DA; }
    .logo { font-size: 22px; font-weight: 800; color: #0F4C45; margin-bottom: 20px; }
    h2 { font-size: 24px; color: #0F4C45; margin-top: 0; margin-bottom: 12px; }
    p { line-height: 1.6; color: #2D3748; font-size: 15px; }
    .btn { display: inline-block; background: #0F4C45; color: #ffffff !important; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 700; margin: 20px 0; }
    .footer { font-size: 12px; color: #718096; margin-top: 24px; border-top: 1px solid #D3E1DA; padding-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🐾 Pawhome</div>
    <h2>${title}</h2>
    <div>${message}</div>
    ${actionText && actionUrl ? `<a href="${actionUrl}" class="btn">${actionText}</a>` : ''}
    <div class="footer">
      ${footerNote || 'Pawhome Pet Adoption Network · Ethical pet rescue across India and worldwide.'}
    </div>
  </div>
</body>
</html>
  `;
}

async function sendApplicationSubmittedEmail({ to, adopterName, petName }) {
  const html = baseEmailTemplate({
    title: `We received your application for ${petName}!`,
    message: `
      <p>Hi ${adopterName},</p>
      <p>Thank you for offering your home to <b>${petName}</b>. Our rescue team reviews every application thoroughly to ensure a safe, lifelong match.</p>
      <p>You can track the progress of your application live in your account dashboard. Decisions are typically finalized within 2 to 3 business days.</p>
    `,
    actionText: 'Track Your Application',
    actionUrl: `${appUrl}/account`
  });

  return sendEmail({
    to,
    subject: `Application Received: ${petName} – Pawhome`,
    html,
    text: `Hi ${adopterName}, thank you for applying to adopt ${petName}. We will review your application in 2-3 business days. Track your progress at ${appUrl}/account`
  });
}

async function sendAdminNewApplicationEmail({ adminEmail, applicantName, petName, place }) {
  const html = baseEmailTemplate({
    title: `New Adoption Application: ${petName}`,
    message: `
      <p>A new adoption application has been submitted by <b>${applicantName}</b> (${place}) for <b>${petName}</b>.</p>
      <p>Please log in to the admin panel to review applicant housing details, inspect uploaded ID proof, and record a decision.</p>
    `,
    actionText: 'Review Application',
    actionUrl: `${appUrl}/admin/applications`
  });

  return sendEmail({
    to: adminEmail,
    subject: `[Admin Action] New Application: ${petName} by ${applicantName}`,
    html,
    text: `New application submitted by ${applicantName} for ${petName}. Review at ${appUrl}/admin/applications`
  });
}

async function sendApplicationDecisionEmail({
  to,
  adopterName,
  petName,
  decision,
  reason,
  certificateId,
  certificatePdfBuffer
}) {
  const isAccepted = decision === 'accept';
  const attachments = [];

  if (isAccepted && certificatePdfBuffer) {
    attachments.push({
      filename: `Pawhome-Certificate-${certificateId}.pdf`,
      content: certificatePdfBuffer
    });
  }

  const message = isAccepted
    ? `
      <p>Hi ${adopterName},</p>
      <p>Congratulations! We are thrilled to inform you that your adoption application for <b>${petName}</b> has been <b>APPROVED</b>!</p>
      <p>Your official Pawhome digital adoption certificate has been issued (Certificate ID: <b>${certificateId}</b>). You can view, download, and verify your certificate directly from your account or using the attached PDF.</p>
      <p>Our shelter coordinator will be in touch shortly to finalize homecoming arrangements.</p>
    `
    : `
      <p>Hi ${adopterName},</p>
      <p>Thank you for your interest in welcoming ${petName} into your home. After thorough review, our team was unable to approve this specific adoption application.</p>
      <p><b>Reason:</b> ${reason || 'Pet requirements do not match current living setup.'}</p>
      <p>We encourage you to explore other rescue pets on Pawhome that may be a closer match for your routine and lifestyle.</p>
    `;

  const html = baseEmailTemplate({
    title: isAccepted ? `Welcome to the family! Adoption Approved for ${petName}` : `Update on your application for ${petName}`,
    message,
    actionText: isAccepted ? 'View Adoption Certificate' : 'Browse Available Pets',
    actionUrl: isAccepted ? `${appUrl}/account` : `${appUrl}/`
  });

  return sendEmail({
    to,
    subject: isAccepted
      ? `Congratulations! Adoption Approved for ${petName} (Cert: ${certificateId})`
      : `Adoption Application Update: ${petName}`,
    html,
    text: isAccepted
      ? `Congratulations ${adopterName}! Your adoption for ${petName} has been approved. Certificate ID: ${certificateId}. View it at ${appUrl}/account`
      : `Hi ${adopterName}, your application for ${petName} could not be approved. Reason: ${reason}.`,
    attachments
  });
}

async function sendMonthlyReportDueEmail({ to, adopterName, petName, month }) {
  const html = baseEmailTemplate({
    title: `${month} Welfare Update Due for ${petName}`,
    message: `
      <p>Hi ${adopterName},</p>
      <p>It's time for your monthly adoption check-in for <b>${petName}</b>! Our shelter rescue team loves seeing how adopted pets are settling in.</p>
      <p>Please take 1 minute to upload a recent photo and share a quick note about their health and routine from your account dashboard.</p>
    `,
    actionText: 'Submit Monthly Update',
    actionUrl: `${appUrl}/account`
  });

  return sendEmail({
    to,
    subject: `Monthly Pet Update Due: ${petName} (${month}) – Pawhome`,
    html,
    text: `Hi ${adopterName}, your ${month} update for ${petName} is due. Please submit your photo and update at ${appUrl}/account`
  });
}

async function sendReportReminderEmail({ to, adopterName, petName, month }) {
  const html = baseEmailTemplate({
    title: `Friendly Reminder: ${month} Update for ${petName}`,
    message: `
      <p>Hi ${adopterName},</p>
      <p>This is a quick reminder that the voluntary monthly welfare check-in for <b>${petName}</b> is still waiting for this month (${month}).</p>
      <p>Submitting monthly updates keeps your adoption in good standing and allows our veterinary team to support you with any behavioral or health questions.</p>
    `,
    actionText: 'Submit Update Now',
    actionUrl: `${appUrl}/account`
  });

  return sendEmail({
    to,
    subject: `Reminder: ${month} Welfare Update for ${petName} is pending`,
    html,
    text: `Hi ${adopterName}, friendly reminder that the ${month} update for ${petName} is pending. Submit at ${appUrl}/account`
  });
}

module.exports = {
  sendEmail,
  sendApplicationSubmittedEmail,
  sendAdminNewApplicationEmail,
  sendApplicationDecisionEmail,
  sendMonthlyReportDueEmail,
  sendReportReminderEmail
};
