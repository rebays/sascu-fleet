const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/mailer");
const {
  sendAdminBookingNotification,
  sendBookingReceivedEmail,
  sendBookingStatusEmail,
  sendBookingUpdatedEmail,
  sendBookingDeletedEmail,
  sendPaymentReceivedEmail,
} = require("../utils/bookingEmails");

const createBooking = catchAsync(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    licenseNumber,
    memberId,
    vehicleId,
    startDate,
    endDate,
    pickupLocation,
    additionalNotes,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !licenseNumber || !vehicleId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, message: "Vehicle not found" });
  }

  if (vehicle.status !== "active") {
    return res.status(400).json({ success: false, message: "This vehicle is not available for booking" });
  }

  const existingBooking = await Booking.findOne({
    vehicle: vehicleId,
    status: "confirmed",
    $or: [{ startDate: { $lt: endDate }, endDate: { $gt: startDate } }],
  });

  if (existingBooking) {
    return res.status(400).json({
      success: false,
      message: "Vehicle already booked for selected dates",
      conflictingBooking: {
        startDate: existingBooking.startDate,
        endDate: existingBooking.endDate,
        bookingRef: existingBooking.bookingRef,
      },
    });
  }

  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const tempPassword = Math.random().toString(36).slice(-8);
    user = await User.create({
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: await bcrypt.hash(tempPassword, 12),
      phone,
      role: "user",
    });
  }

  const ms = new Date(endDate) - new Date(startDate);
  const hours = ms / (1000 * 60 * 60);
  const days = hours / 24;
  const totalPrice = days >= 1
    ? Math.ceil(days) * vehicle.pricePerDay
    : Math.ceil(hours) * vehicle.pricePerHour;

  const deposit = Math.ceil(totalPrice * 0.3);
  const balance = totalPrice - deposit;

  const booking = await Booking.create({
    user: user._id,
    vehicle: vehicleId,
    startDate,
    endDate,
    totalPrice,
    deposit: 0,
    balance: totalPrice,
    driversLicense: licenseNumber,
    memberId,
    pickupLocation,
    note: additionalNotes,
    status: "pending",
  });

  try {
    const invoice = await Invoice.create({
      booking: booking._id,
      bookingRef: booking.bookingRef,
      totalAmount: totalPrice,
      dueDate: new Date(startDate),
      paidAmount: 0,
    });
    booking.invoice = invoice._id;
    await booking.save();
  } catch (err) {
    console.error("Invoice creation failed:", err);
  }

  await booking.populate("vehicle");
  await booking.populate("user", "name email phone");

  await Promise.all([
    sendAdminBookingNotification(booking),
    sendBookingReceivedEmail(booking),
  ]);

  res.status(201).json({
    success: true,
    message: "Booking created successfully",
    data: {
      bookingRef: booking.bookingRef,
      booking: {
        _id: booking._id,
        bookingRef: booking.bookingRef,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        deposit,
        balance,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        vehicle: booking.vehicle,
        createdAt: booking.createdAt,
      },
      customerInfo: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        licenseNumber,
        memberId: booking.memberId,
      },
    },
  });
});

const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate("vehicle")
    .sort({ createdAt: -1 });

  res.json(bookings);
});

const getAllBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find()
    .populate("user", "name email phone memberId")
    .populate("vehicle", "make model licensePlate type")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

const getBookingById = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("user", "name email memberId")
    .populate(
      "vehicle",
      "make model licensePlate images pricePerDay pricePerHalfDay pricePerDayMember pricePerHalfDayMember pricePerDayOutOfTown pricePerHalfDayOutOfTown pricePerDayMemberOutOfTown pricePerHalfDayMemberOutOfTown"
    );

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  res.json({ success: true, data: booking });
});

const getBookingByRef = catchAsync(async (req, res) => {
  const booking = await Booking.findOne({ bookingRef: req.params.ref })
    .populate("user", "name email phone memberId")
    .populate("vehicle", "make model year licensePlate images location pricePerDay pricePerHour");

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  // If booking start date is today or in the past, return expired
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bEnd = new Date(booking.endDate);
  const bookingDate = new Date(bEnd.getFullYear(), bEnd.getMonth(), bEnd.getDate());
  if (bookingDate.getTime() <= today.getTime()) {
    return res.status(400).json({ success: false, message: "Booking expired" });
  }

  res.json({ success: true, data: booking });
});

const createBookingAdmin = catchAsync(async (req, res) => {
  const { vehicle: vehicleId, startDate, endDate } = req.body;

  const vehicleDoc = await Vehicle.findById(vehicleId).select('status').lean();
  if (!vehicleDoc) {
    return res.status(404).json({ success: false, message: "Vehicle not found" });
  }
  if (vehicleDoc.status !== "active") {
    return res.status(400).json({ success: false, message: "This vehicle is inactive and cannot be booked" });
  }

  const booking = await Booking.create(req.body);
  const { vehicle } = req.body;

  // Check if vehicle is already booked
  const conflictingBooking = await Booking.findOne({
    vehicle,
    status: "confirmed",
    $or: [{ startDate: { $lt: endDate }, endDate: { $gt: startDate } }],
  });

  if (conflictingBooking) {
    return res.status(400).json({
      success: false,
      message: `Vehicle is already booked from ${new Date(
        conflictingBooking.startDate
      ).toLocaleDateString()} to ${new Date(
        conflictingBooking.endDate
      ).toLocaleDateString()}`,
    });
  }

  // Create an invoice for admin-created booking (same behavior as public booking creation)
  try {
    const invoice = await Invoice.create({
      booking: booking._id,
      bookingRef: booking.bookingRef,
      totalAmount: booking.totalPrice,
      dueDate: new Date(booking.startDate) || new Date(), // due on pickup day (fallback to now)
      paidAmount: 0,
    });

    booking.invoice = invoice._id;
    await booking.save();
  } catch (err) {
    // If invoice creation fails, log and continue — booking was created
    console.error("Failed to create invoice for admin booking:", err);
  }

  await booking.populate("user vehicle");
  await sendBookingReceivedEmail(booking);
  res.status(201).json({ success: true, data: booking });
});

const updateBookingAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { vehicle, startDate, endDate } = req.body;

  const existingBooking = await Booking.findById(id).select('status');
  if (!existingBooking) return res.status(404).json({ message: "Booking not found" });

  if (req.user.role !== 'superadmin' && ['confirmed', 'completed'].includes(existingBooking.status)) {
    return res.status(409).json({
      success: false,
      message: `Cannot edit a ${existingBooking.status} booking.`,
    });
  }

  if (vehicle && (startDate || endDate)) {
    const existing = await Booking.findOne({
      _id: { $ne: id }, // exclude current booking
      vehicle,
      status: "confirmed",
      $or: [
        {
          startDate: { $lt: endDate || new Date().toISOString() },
          endDate: { $gt: startDate || new Date().toISOString() },
        },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Vehicle is already booked during this period`,
      });
    }
  }

  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("user vehicle");

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  await sendBookingUpdatedEmail(booking);

  res.json({ success: true, data: booking });
});

const deleteBookingAdmin = catchAsync(async (req, res) => {
  const existingBooking = await Booking.findById(req.params.id)
    .select('status user vehicle bookingRef')
    .populate("user", "name email")
    .populate("vehicle", "make model");
  if (!existingBooking) return res.status(404).json({ message: "Booking not found" });

  if (req.user.role !== 'superadmin' && ['confirmed', 'completed'].includes(existingBooking.status)) {
    return res.status(409).json({
      success: false,
      message: `Cannot delete a ${existingBooking.status} booking.`,
    });
  }

  await Booking.findByIdAndDelete(req.params.id);

  await sendBookingDeletedEmail(existingBooking);

  res.json({ success: true, message: "Booking deleted" });
});

const recordPayment = catchAsync(async (req, res) => {
  const { id } = req.params; // booking ID
  const { amount, paymentMethod = "cash", notes = "" } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid amount is required" });
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Create separate Payment document
  const payment = await Payment.create({
    booking: booking._id,
    bookingRef: booking.bookingRef,
    amount: Number(amount),
    paymentMethod,
    status: "succeeded",
    paidBy: req.user.id, // admin who recorded it
    notes,
  });

  // Update booking deposit & balance
  const totalPaid = await Payment.aggregate([
    { $match: { booking: booking._id, status: "succeeded" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const paidAmount = totalPaid[0]?.total || 0;

  booking.deposit = paidAmount;
  booking.balance = booking.totalPrice - paidAmount;

  if (booking.balance <= 0) {
    booking.paymentStatus = "paid";
  } else if (paidAmount > 0) {
    booking.paymentStatus = "partial";
  }

  await booking.save();

  // Populate everything for frontend
  await booking.populate([
    { path: "user", select: "name email memberId" },
    { path: "vehicle", select: "make model licensePlate images" },
  ]);

  await payment.populate("paidBy", "name");

  await sendPaymentReceivedEmail(booking, payment);

  res.status(201).json({
    success: true,
    message: "Payment recorded successfully",
    data: {
      payment,
      booking,
    },
  });
});

const getPayments = catchAsync(async (req, res) => {
  const { id } = req.params; // booking ID
  const payments = await Payment.find({ booking: id })
    .populate("paidBy", "name email")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: payments });
});

const sendInvoiceEmail = catchAsync(async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findById(id)
    .populate("user", "name email")
    .populate("vehicle", "make model licensePlate");

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Generate PDF
  const doc = new PDFDocument({ margin: 50 });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", async () => {
    const pdfBuffer = Buffer.concat(buffers);

    const sent = await sendMail({
      to: booking.user.email,
      cc: "gsaemane@flysolomons.com",
      subject: `Invoice #${booking.bookingRef} - Vehicle Booking`,
      html: `
        <h2>Hi ${booking.user.name},</h2>
        <p>Thank you for your booking! Please find your invoice attached.</p>
        <p><strong>Booking Ref:</strong> ${booking.bookingRef}</p>
        <p><strong>Vehicle:</strong> ${booking.vehicle.make} ${
        booking.vehicle.model
      }</p>
        <p><strong>Total Amount:</strong> SBD${booking.totalPrice}</p>
        <p><strong>Amount Paid:</strong> SBD${booking.deposit || 0}</p>
        <p><strong>Balance Due:</strong> SBD${
          booking.balance || booking.totalPrice
        }</p>
        <br>
        <p>Best regards,<br>SASCU Rentals Team</p>
        <p>Please come back soon!</p>
      `,
      attachments: [
        {
          filename: `Invoice-${booking.bookingRef}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (sent) {
      res.json({ success: true, message: "Invoice sent successfully!" });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to dispatch invoice email. Please check RESEND_API_KEY.",
      });
    }
  });

  // PDF Design
  doc.fontSize(20).text("INVOICE", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice #: ${booking.bookingRef}`);
  doc.text(`Date: ${new Date().toLocaleDateString("en-ZA")}`);
  doc.text(`Customer: ${booking.user.name}`);
  doc.text(`Email: ${booking.user.email}`);
  doc.moveDown();

  doc.text("Booking Details", { underline: true });
  doc.text(`Vehicle: ${booking.vehicle.make} ${booking.vehicle.model}`);
  doc.text(`License: ${booking.vehicle.licensePlate}`);
  doc.text(
    `Period: ${new Date(booking.startDate).toLocaleDateString()} → ${new Date(
      booking.endDate
    ).toLocaleDateString()}`
  );
  doc.moveDown();

  doc.text("Payment Summary", { underline: true });
  doc.text(
    `Total Amount:                        SBD${booking.totalPrice.toFixed(2)}`
  );
  doc.text(
    `Amount Paid:                        - SBD${(booking.deposit || 0).toFixed(
      2
    )}`
  );
  doc.moveDown();
  doc
    .fontSize(14)
    .text(
      `Balance Due:                        SBD${(
        booking.balance || booking.totalPrice
      ).toFixed(2)}`,
      { align: "right" }
    );

  doc.end();
});

const sendReceiptEmail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id)
    .populate('user', 'name email')
    .populate('vehicle', 'make model licensePlate');

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const payments = await Payment.find({ booking: booking._id, status: 'succeeded' }).sort({ createdAt: -1 });

  if (!payments || payments.length === 0) {
    return res.status(400).json({ message: 'No successful payments found for this booking' });
  }

  const docR = new PDFDocument({ margin: 50 });
  const buffersR = [];
  docR.on('data', buffersR.push.bind(buffersR));
  docR.on('end', async () => {
    const pdfBuffer = Buffer.concat(buffersR);

    const sent = await sendMail({
      to: booking.user.email,
      cc: 'gsaemane@flysolomons.com',
      subject: `Payment Receipt - ${booking.bookingRef}`,
      html: `
        <h2>Hi ${booking.user.name},</h2>
        <p>Thank you for your payment. Please find your receipt attached.</p>
        <p><strong>Booking Ref:</strong> ${booking.bookingRef}</p>
      `,
      attachments: [{ filename: `Receipt-${booking.bookingRef}.pdf`, content: pdfBuffer }],
    });

    if (sent) {
      res.json({ success: true, message: 'Receipt sent successfully!' });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to dispatch receipt email. Please check RESEND_API_KEY.",
      });
    }
  });

  docR.fontSize(20).text('RECEIPT', { align: 'center' });
  docR.moveDown();
  docR.fontSize(12).text(`Receipt For: ${booking.bookingRef}`);
  docR.text(`Date: ${new Date().toLocaleDateString('en-ZA')}`);
  docR.text(`Customer: ${booking.user.name}`);
  docR.moveDown();

  docR.text('Payment Details', { underline: true });
  let totalPaid = 0;
  payments.forEach((p) => {
    totalPaid += p.amount;
    docR.text(`${new Date(p.createdAt).toLocaleString()} • ${p.paymentMethod} • SBD${p.amount.toFixed(2)} • ${p.notes || ''}`);
  });

  docR.moveDown();
  docR.fontSize(14).text(`Total Paid: SBD${totalPaid.toFixed(2)}`, { align: 'right' });

  docR.end();
});

const updateBookingStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, note = "" } = req.body;

  if (!["confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  // Terminal states can't be re-approved or re-cancelled
  if (["cancelled", "completed"].includes(booking.status)) {
    return res.status(409).json({
      success: false,
      message: `Booking is already ${booking.status} and its status cannot be changed.`,
    });
  }

  // Pending bookings may overlap each other, so confirmation is the point
  // where double-booking must be prevented
  if (status === "confirmed") {
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      vehicle: booking.vehicle,
      status: "confirmed",
      $or: [
        { startDate: { $lt: booking.endDate }, endDate: { $gt: booking.startDate } },
      ],
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm: vehicle already has a confirmed booking (${conflictingBooking.bookingRef}) from ${new Date(
          conflictingBooking.startDate
        ).toLocaleDateString()} to ${new Date(
          conflictingBooking.endDate
        ).toLocaleDateString()}`,
      });
    }
  }

  const wasConfirmed = booking.status === "confirmed";
  // Cancelling a confirmed booking that already collected payment leaves
  // money owed back to the customer - flag it instead of silently losing track
  const needsRefund = status === "cancelled" && ["partial", "paid"].includes(booking.paymentStatus);
  if (needsRefund) {
    booking.paymentStatus = "refunded";
  }

  const actionLabel = status === "confirmed" ? "Approved" : wasConfirmed ? "Cancelled" : "Rejected";

  // Record in history
  booking.statusHistory.push({
    status,
    changedBy: req.user.id,
    note: note || `${actionLabel} by admin${needsRefund ? " - refund required" : ""}`,
  });

  // Update current status
  booking.status = status;

  await booking.save();

  // A cancelled booking's invoice is void - stop it showing as outstanding/payable
  if (status === "cancelled") {
    await Invoice.findOneAndUpdate(
      { booking: booking._id, status: { $ne: "cancelled" } },
      { status: "cancelled" }
    );
  }

  await booking.populate([
    { path: "user", select: "name email memberId" },
    { path: "vehicle", select: "make model licensePlate" },
    { path: "statusHistory.changedBy", select: "name" },
  ]);

  await sendBookingStatusEmail(booking, actionLabel, note);

  res.json({
    success: true,
    message: `Booking ${actionLabel.toLowerCase()}`,
    data: booking,
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  getBookingByRef,
  createBookingAdmin,
  updateBookingAdmin,
  deleteBookingAdmin,
  recordPayment,
  getPayments,
  sendInvoiceEmail,
  sendReceiptEmail,
  updateBookingStatus,
};
