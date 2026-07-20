const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

const COMPANY_NAME = process.env.COMPANY_NAME || 'SASCU Rentals';

// Errors are caught and logged here so a notification failure never breaks
// the booking action (create/update/cancel) that triggered it.
const sendMail = async (options) => {
  try {
    await getTransporter().sendMail({
      from: `"${COMPANY_NAME}" <${process.env.SMTP_USER}>`,
      ...options,
    });
    return true;
  } catch (err) {
    console.error('Email dispatch failed:', err.message);
    return false;
  }
};

module.exports = { sendMail, COMPANY_NAME };
