const { sendMail, COMPANY_NAME } = require('./mailer');

const fmtDate = (d) => new Date(d).toLocaleDateString('en-ZA');
const money = (n) => `SBD${Number(n || 0).toFixed(2)}`;

const vehicleLabel = (vehicle) =>
  vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : 'N/A';

const footer = `<br><p>Best regards,<br>${COMPANY_NAME} Team</p>`;

// Sent to the ops/admin inbox whenever a new booking comes in.
const sendAdminBookingNotification = async (booking) => {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.COMPANY_EMAIL;
  if (!adminEmail) return;

  await sendMail({
    to: adminEmail,
    subject: `New Booking - ${booking.bookingRef}`,
    html: `
      <h2>New booking received</h2>
      <p><strong>Booking Ref:</strong> ${booking.bookingRef}</p>
      <p><strong>Customer:</strong> ${booking.user?.name || ''} (${booking.user?.email || ''})</p>
      <p><strong>Phone:</strong> ${booking.user?.phone || 'N/A'}</p>
      <p><strong>Vehicle:</strong> ${vehicleLabel(booking.vehicle)}</p>
      <p><strong>Period:</strong> ${fmtDate(booking.startDate)} &rarr; ${fmtDate(booking.endDate)}</p>
      <p><strong>Total:</strong> ${money(booking.totalPrice)}</p>
      <p><strong>Status:</strong> ${booking.status}</p>
    `,
  });
};

// Sent to the client right after they (or an admin on their behalf) create a booking.
const sendBookingReceivedEmail = async (booking) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Booking Received - ${booking.bookingRef}`,
    html: `
      <h2>Hi ${booking.user?.name || ''},</h2>
      <p>We've received your booking request. Here are the details:</p>
      <p><strong>Booking Ref:</strong> ${booking.bookingRef}</p>
      <p><strong>Vehicle:</strong> ${vehicleLabel(booking.vehicle)}</p>
      <p><strong>Period:</strong> ${fmtDate(booking.startDate)} &rarr; ${fmtDate(booking.endDate)}</p>
      <p><strong>Total Amount:</strong> ${money(booking.totalPrice)}</p>
      <p><strong>Status:</strong> ${booking.status}</p>
      <p>We'll email you again as soon as your booking is confirmed.</p>
      ${footer}
    `,
  });
};

// Sent to the client whenever an admin changes booking status (confirmed/cancelled/rejected).
const sendBookingStatusEmail = async (booking, actionLabel, note) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Booking ${actionLabel} - ${booking.bookingRef}`,
    html: `
      <h2>Hi ${booking.user?.name || ''},</h2>
      <p>Your booking <strong>${booking.bookingRef}</strong> has been <strong>${actionLabel.toLowerCase()}</strong>.</p>
      <p><strong>Vehicle:</strong> ${vehicleLabel(booking.vehicle)}</p>
      <p><strong>Period:</strong> ${fmtDate(booking.startDate)} &rarr; ${fmtDate(booking.endDate)}</p>
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
      ${footer}
    `,
  });
};

// Sent to the client whenever an admin edits booking details (dates, vehicle, pickup, etc).
const sendBookingUpdatedEmail = async (booking) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Booking Updated - ${booking.bookingRef}`,
    html: `
      <h2>Hi ${booking.user?.name || ''},</h2>
      <p>Your booking <strong>${booking.bookingRef}</strong> has been updated. Current details:</p>
      <p><strong>Vehicle:</strong> ${vehicleLabel(booking.vehicle)}</p>
      <p><strong>Period:</strong> ${fmtDate(booking.startDate)} &rarr; ${fmtDate(booking.endDate)}</p>
      <p><strong>Pickup Location:</strong> ${booking.pickupLocation || 'N/A'}</p>
      <p><strong>Total Amount:</strong> ${money(booking.totalPrice)}</p>
      <p><strong>Status:</strong> ${booking.status}</p>
      ${footer}
    `,
  });
};

// Sent to the client when a booking is deleted outright by an admin.
const sendBookingDeletedEmail = async (booking) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Booking Cancelled - ${booking.bookingRef}`,
    html: `
      <h2>Hi ${booking.user?.name || ''},</h2>
      <p>Your booking <strong>${booking.bookingRef}</strong> for ${vehicleLabel(booking.vehicle)} has been cancelled and removed from our system.</p>
      <p>If you believe this is a mistake, please contact us.</p>
      ${footer}
    `,
  });
};

// Sent to the client after an admin records a payment against their booking.
const sendPaymentReceivedEmail = async (booking, payment) => {
  const to = booking.user?.email;
  if (!to) return;

  await sendMail({
    to,
    subject: `Payment Received - ${booking.bookingRef}`,
    html: `
      <h2>Hi ${booking.user?.name || ''},</h2>
      <p>We've recorded a payment on your booking <strong>${booking.bookingRef}</strong>.</p>
      <p><strong>Amount Paid:</strong> ${money(payment.amount)} (${payment.paymentMethod})</p>
      <p><strong>Total Paid So Far:</strong> ${money(booking.deposit)}</p>
      <p><strong>Balance Due:</strong> ${money(booking.balance)}</p>
      ${footer}
    `,
  });
};

module.exports = {
  sendAdminBookingNotification,
  sendBookingReceivedEmail,
  sendBookingStatusEmail,
  sendBookingUpdatedEmail,
  sendBookingDeletedEmail,
  sendPaymentReceivedEmail,
};
