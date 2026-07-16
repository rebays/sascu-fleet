const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Vehicle = require("../models/Vehicle");
const catchAsync = require("../utils/catchAsync");
const csv = require("fast-csv");
const moment = require("moment");

const getDashboard = catchAsync(async (req, res) => {

  const { start, end } = req.query;

  // Date range (default last 30 days)
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const dateMatch = {
    createdAt: { $gte: startDate, $lte: endDate },
  };

  // 1. Total Revenue (all succeeded payments in range)
  const totalRevenueResult = await Payment.aggregate([
    { $match: { ...dateMatch, status: "succeeded" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  totalRevenue = totalRevenueResult[0]?.total || 0;

  // 2. Today's Revenue
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayRevenueResult = await Payment.aggregate([
    {
      $match: {
        status: "succeeded",
        createdAt: { $gte: todayStart, $lte: todayEnd },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  todayRevenue = todayRevenueResult[0]?.total || 0;


  // 3. Total Bookings in range
  const totalBookings = await Booking.countDocuments(dateMatch);

  
  // 4. Active Vehicles (vehicles with at least one booking in range)
  const activeVehiclesResult = await Booking.distinct("vehicle", dateMatch);
  const totalVehicles = await Vehicle.countDocuments();
  const activeVehicles = activeVehiclesResult.length;

  // 5. Pending Bookings
  const pendingBookings = await Booking.countDocuments({
    ...dateMatch,
    status: "pending",
  });

  // 6. Paid Bookings
  const paidBookings = await Booking.countDocuments({
    ...dateMatch,
    paymentStatus: "paid",
  });

  // 7. Bookings Need Approval (usually same as pending)
  const bookingsNeedApproval = pendingBookings;

 // 8. Daily Revenue (for line chart)
  const dailyRevenue = await Payment.aggregate([
    { $match: { ...dateMatch, status: "succeeded" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        amount: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", amount: 1, _id: 0 } },
  ]);

  // 9. Bookings by Status (for bar chart)
  const bookingsByStatus = await Booking.aggregate([
    { $match: dateMatch },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    { $project: { status: "$_id", count: 1, _id: 0 } },
  ]).then(results =>
    results.reduce((acc, curr) => ({ ...acc, [curr.status]: curr.count }), {})
  );

  res.json({
    success: true,
    data: {
      totalRevenue,
      todayRevenue,
      totalBookings,
      activeVehicles,
      pendingBookings,
      paidBookings,
      bookingsNeedApproval,
      dailyRevenue,
      bookingsByStatus,
    },
  });
  
});

const getRevenueReport = catchAsync(async (req, res) => {
  let { startDate, endDate, groupBy = "day" } = req.query;

  const match = { status: "succeeded" };
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const dateFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";
  const revenue = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // CSV export support
  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=revenue-${groupBy}-${startDate || 'all'}-to-${endDate || 'all'}.csv`
    );

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    for (const r of revenue) {
      csvStream.write({
        Period: r._id,
        Revenue: r.revenue,
        Transactions: r.count,
      });
    }

    csvStream.end();
    return;
  }

  res.json({ revenue });
});

const getRevenueByVehicleType = catchAsync(async (req, res) => {
  let { startDate, endDate, format = "json" } = req.query;

  const match = { status: "succeeded" };
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const revenue = await Payment.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "bookings",
        localField: "booking",
        foreignField: "_id",
        as: "booking",
      },
    },
    { $unwind: "$booking" },
    {
      $lookup: {
        from: "vehicles",
        localField: "booking.vehicle",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },
    {
      $group: {
        _id: "$vehicle.type",
        revenue: { $sum: "$amount" },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=revenue-by-vehicle-type-${startDate || 'all'}-to-${endDate || 'all'}.csv`
    );

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    for (const r of revenue) {
      csvStream.write({
        Type: r._id,
        Revenue: r.revenue,
        Bookings: r.bookings,
      });
    }

    csvStream.end();
    return;
  }

  res.json({ revenue });
});

const getTopVehicles = catchAsync(async (req, res) => {
  const topVehicles = await Booking.aggregate([
    { $match: { paymentStatus: "paid" } },
    {
      $group: {
        _id: "$vehicle",
        bookings: { $sum: 1 },
        revenue: { $sum: "$totalPrice" },
      },
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "_id",
        foreignField: "_id",
        as: "vehicle",
      },
    },
    { $unwind: "$vehicle" },
    {
      $project: {
        make: "$vehicle.make",
        model: "$vehicle.model",
        licensePlate: "$vehicle.licensePlate",
        bookings: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  res.json(topVehicles);
});

// Full booking detail (customer + itemized payments) for a date range —
// backs the admin dashboard's "Export Excel" button.
const getBookingsExport = catchAsync(async (req, res) => {
  const { start, end } = req.query;

  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({ createdAt: { $gte: startDate, $lte: endDate } })
    .populate("user", "name email phone memberId")
    .populate("vehicle", "make model licensePlate type")
    .sort({ createdAt: -1 })
    .lean();

  const payments = await Payment.find({ booking: { $in: bookings.map((b) => b._id) } })
    .sort({ createdAt: 1 })
    .lean();

  const paymentsByBooking = payments.reduce((acc, p) => {
    const key = p.booking.toString();
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  const data = bookings.map((b) => ({
    bookingRef: b.bookingRef,
    status: b.status,
    paymentStatus: b.paymentStatus,
    locationType: b.locationType,
    startDate: b.startDate,
    endDate: b.endDate,
    totalPrice: b.totalPrice,
    deposit: b.deposit,
    balance: b.balance,
    pickupLocation: b.pickupLocation,
    driversLicense: b.driversLicense,
    memberId: b.memberId || b.user?.memberId || "",
    createdAt: b.createdAt,
    customer: {
      name: b.user?.name || "N/A",
      email: b.user?.email || "N/A",
      phone: b.user?.phone || "",
    },
    vehicle: {
      make: b.vehicle?.make || "",
      model: b.vehicle?.model || "",
      licensePlate: b.vehicle?.licensePlate || "",
      type: b.vehicle?.type || "",
    },
    payments: (paymentsByBooking[b._id.toString()] || []).map((p) => ({
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      status: p.status,
      createdAt: p.createdAt,
      notes: p.notes || "",
    })),
  }));

  res.json({ success: true, count: data.length, dateRange: { start: startDate, end: endDate }, data });
});

// Export bookings to CSV
const exportBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find()
    .populate("user", "name email")
    .populate("vehicle", "make model licensePlate")
    .sort({ createdAt: -1 });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=bookings-report.csv"
  );

  const csvStream = csv.format({ headers: true });
  csvStream.pipe(res);

  for (const b of bookings) {
    const paid = await Payment.aggregate([
      { $match: { booking: b._id, status: "succeeded" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    csvStream.write({
      Ref: b.bookingRef,
      Customer: b.user?.name || "N/A",
      Email: b.user?.email || "N/A",
      Vehicle: `${b.vehicle?.make || ""} ${b.vehicle?.model || ""} (${
        b.vehicle?.licensePlate || ""
      })`,
      Start: moment(b.startDate).format("YYYY-MM-DD"),
      End: moment(b.endDate).format("YYYY-MM-DD"),
      Total: b.totalPrice,
      Paid: paid[0]?.total || 0,
      Balance: b.totalPrice - (paid[0]?.total || 0),
      Status: b.status,
      Payment: b.paymentStatus,
      BookedOn: moment(b.createdAt).format("YYYY-MM-DD HH:mm"),
    });
  }
  csvStream.end();
});

module.exports = {
  getDashboard,
  getRevenueReport,
  getRevenueByVehicleType,
  getTopVehicles,
  exportBookings,
  getBookingsExport,
};
