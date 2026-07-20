const { Resend } = require('resend');

let resend;

const getResend = () => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const COMPANY_NAME = process.env.COMPANY_NAME || 'SASCU Rentals';
// Resend's shared sandbox domain can only deliver to the email address that
// owns the Resend account until a custom domain is verified there.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Errors are caught and logged here so a notification failure never breaks
// the booking action (create/update/cancel) that triggered it.
const sendMail = async ({ to, cc, subject, html, attachments }) => {
  try {
    const { error } = await getResend().emails.send({
      from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
      to,
      cc,
      subject,
      html,
      attachments,
    });
    if (error) {
      console.error('Email dispatch failed:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email dispatch failed:', err.message);
    return false;
  }
};

module.exports = { sendMail, COMPANY_NAME };
