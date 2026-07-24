const { sendMail } = require('./mailer');
const { renderEmail, renderStatusBadge } = require('./emailTemplate');

const fmtDate = (d) => new Date(d).toLocaleDateString('en-ZA');
const money = (n) => `SBD${Number(n || 0).toFixed(2)}`;

const vehicleLabel = (vehicle) =>
  vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : 'N/A';

const detailRow = (label, value) => `
  <tr>
    <td style="padding:4px 0; color:#6b7280; width:150px;">${label}</td>
    <td style="padding:4px 0; color:#111827; font-weight:600;">${value}</td>
  </tr>
`;

const detailsTable = (rows) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; font-size:14px; margin:16px 0;">
    ${rows.join('')}
  </table>
`;

// Sent to the ops/admin inbox whenever a new booking comes in.
const sendAdminBookingNotification = async (booking) => {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.COMPANY_EMAIL;
  if (!adminEmail) return;

  await sendMail({
    to: adminEmail,
    subject: `New Booking - ${booking.bookingRef}`,
    html: renderEmail(`
      <h2 style="margin-top:0;">New booking received</h2>
      <p>A new booking has come in. ${renderStatusBadge(booking.status)}</p>
      ${detailsTable([
        detailRow('Booking Ref', booking.bookingRef),
        detailRow('Customer', `${booking.user?.name || ''} (${booking.user?.email || ''})`),
        detailRow('Phone', booking.user?.phone || 'N/A'),
        detailRow('Vehicle', vehicleLabel(booking.vehicle)),
        detailRow('Period', `${fmtDate(booking.startDate)} &rarr; ${fmtDate(booking.endDate)}`),
        detailRow('Total', money(booking.totalPrice)),
      ])}
    `),
  });
};

// Sent to the client right after they (or an admin on their behalf) create a booking.
const sendBookingReceivedEmail = async (booking) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Booking Received - ${booking.bookingRef}`,
    html: renderEmail(`
      <h2 style="margin-top:0;">Hi ${booking.user?.name || ''},</h2>
      <p>We've received your booking request. Here are the details:</p>
      ${detailsTable([
        detailRow('Booking Ref', booking.bookingRef),
        detailRow('Vehicle', vehicleLabel(booking.vehicle)),
        detailRow('Period', `${fmtDate(booking.startDate)} &rarr; ${fmtDate(booking.endDate)}`),
        ...(booking.requestedPickupTime ? [detailRow('Requested Pickup Time', booking.requestedPickupTime)] : []),
        detailRow('Total Amount', money(booking.totalPrice)),
        detailRow('Status', renderStatusBadge(booking.status)),
      ])}
      <p>We'll email you again as soon as your booking is confirmed.</p>
    `),
  });
};

// Sent to the client whenever an admin changes booking status (confirmed/cancelled/rejected).
const sendBookingStatusEmail = async (booking, actionLabel, note) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Booking ${actionLabel} - ${booking.bookingRef}`,
    html: renderEmail(`
      <h2 style="margin-top:0;">Hi ${booking.user?.name || ''},</h2>
      <p>Your booking <strong>${booking.bookingRef}</strong> has been ${renderStatusBadge(actionLabel)}.</p>
      ${detailsTable([
        detailRow('Vehicle', vehicleLabel(booking.vehicle)),
        detailRow('Period', `${fmtDate(booking.startDate)} &rarr; ${fmtDate(booking.endDate)}`),
        ...(note ? [detailRow('Note', note)] : []),
      ])}
    `),
  });
};

// Sent to the client whenever an admin edits booking details (dates, vehicle, pickup, etc).
const sendBookingUpdatedEmail = async (booking) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Booking Updated - ${booking.bookingRef}`,
    html: renderEmail(`
      <h2 style="margin-top:0;">Hi ${booking.user?.name || ''},</h2>
      <p>Your booking <strong>${booking.bookingRef}</strong> has been updated. Current details:</p>
      ${detailsTable([
        detailRow('Vehicle', vehicleLabel(booking.vehicle)),
        detailRow('Period', `${fmtDate(booking.startDate)} &rarr; ${fmtDate(booking.endDate)}`),
        detailRow('Pickup Location', booking.pickupLocation || 'N/A'),
        ...(booking.confirmedPickupTime
          ? [detailRow('Confirmed Pickup Time', booking.confirmedPickupTime)]
          : booking.requestedPickupTime
          ? [detailRow('Requested Pickup Time', booking.requestedPickupTime)]
          : []),
        detailRow('Total Amount', money(booking.totalPrice)),
        detailRow('Status', renderStatusBadge(booking.status)),
      ])}
    `),
  });
};

// Sent to the client when their pickup time is confirmed (or changed) by an admin.
const sendPickupTimeConfirmedEmail = async (booking) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Pickup Time Confirmed - ${booking.bookingRef}`,
    html: renderEmail(`
      <h2 style="margin-top:0;">Hi ${booking.user?.name || ''},</h2>
      <p>Your pickup time for booking <strong>${booking.bookingRef}</strong> has been confirmed.</p>
      ${detailsTable([
        detailRow('Vehicle', vehicleLabel(booking.vehicle)),
        detailRow('Pickup Date', fmtDate(booking.startDate)),
        detailRow('Confirmed Pickup Time', booking.confirmedPickupTime || 'N/A'),
        detailRow('Pickup Location', booking.pickupLocation || 'N/A'),
      ])}
      <p>Please arrive at the pickup location around this time. Contact us if this doesn't work for you.</p>
    `),
  });
};

// Sent to the client when a booking is deleted outright by an admin.
const sendBookingDeletedEmail = async (booking) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Booking Cancelled - ${booking.bookingRef}`,
    html: renderEmail(`
      <h2 style="margin-top:0;">Hi ${booking.user?.name || ''},</h2>
      <p>Your booking <strong>${booking.bookingRef}</strong> for ${vehicleLabel(booking.vehicle)} has been cancelled and removed from our system.</p>
      <p>If you believe this is a mistake, please contact us.</p>
    `),
  });
};

// Sent to the client after an admin records a payment against their booking.
const sendPaymentReceivedEmail = async (booking, payment) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Payment Received - ${booking.bookingRef}`,
    html: renderEmail(`
      <h2 style="margin-top:0;">Hi ${booking.user?.name || ''},</h2>
      <p>We've recorded a payment on your booking <strong>${booking.bookingRef}</strong>.</p>
      ${detailsTable([
        detailRow('Amount Paid', `${money(payment.amount)} (${payment.paymentMethod})`),
        detailRow('Total Paid So Far', money(booking.deposit)),
        detailRow('Balance Due', money(booking.balance)),
      ])}
    `),
  });
};

module.exports = {
  sendAdminBookingNotification,
  sendBookingReceivedEmail,
  sendBookingStatusEmail,
  sendBookingUpdatedEmail,
  sendBookingDeletedEmail,
  sendPaymentReceivedEmail,
  sendPickupTimeConfirmedEmail,
};
