// src/controllers/vehicleController.js

//for available vehicles 
//1st expect date range, return list of vechiels that are available in that date range
//2nd expect vehicle id, return booking dates for that vehicle from day after up to next 3 months
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const catchAsync = require('../utils/catchAsync');

const getVehicles = catchAsync(async (req, res) => {
  const vehicles = await Vehicle.find();
  res.json(vehicles);
});

const searchAvailableVehicles = catchAsync(async (req, res) => {
  const { startDate, endDate, type } = req.query;

  const query = {};
  if (type) query.type = type;

  const vehicles = await Vehicle.find(query);

  if (!startDate || !endDate) {
    return res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  }

  const bookedVehicles = await Booking.find({
    status: { $in: ["pending", "confirmed"] },
    $or: [{ startDate: { $lt: endDate }, endDate: { $gt: startDate } }],
  }).distinct("vehicle");

  const available = vehicles.filter(
    (v) => !bookedVehicles.some((id) => id.toString() === v._id.toString())
  );

  res.json({
    success: true,
    count: available.length,
    dateRange: { startDate, endDate },
    data: available,
  });
});

const getVehicleById = catchAsync(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
  res.json(vehicle);
});

const getAvailableVehiclesByDateRange = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query; 
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate query parameters are required' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ message: 'Invalid startDate or endDate' });
  }

  if (start > end) {
    return res.status(400).json({ message: 'startDate must be before endDate' });
  }

  // Find bookings that overlap the requested range and are active
  const conflictingBookings = await Booking.find({
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } }
    ]
  }).select('vehicle').lean();

  const blockedVehicleIds = conflictingBookings.map(b => String(b.vehicle));

  const vehicles = await Vehicle.find({
    isAvailable: true,
    _id: { $nin: blockedVehicleIds }
  });

  res.json({ success: true, count: vehicles.length, data: vehicles });
});

const getBookingDatesForVehicle = catchAsync(async (req, res) => {
  const { id } = req.params;

  const from = new Date();
  from.setDate(from.getDate() + 1);
  from.setHours(0,0,0,0);

  const to = new Date(from);
  to.setMonth(to.getMonth() + 3);
  to.setHours(23,59,59,999);

  // Verify vehicle exists
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

  // Find bookings for this vehicle that overlap the window
  const bookings = await Booking.find({
    vehicle: id,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { startDate: { $lte: to }, endDate: { $gte: from } }
    ]
  }).select('startDate endDate bookingRef status').sort('startDate').lean();

  // Normalize ranges into the requested window
  const ranges = bookings.map(b => ({
    bookingRef: b.bookingRef,
    status: b.status,
    startDate: new Date(Math.max(new Date(b.startDate), from)),
    endDate: new Date(Math.min(new Date(b.endDate), to))
  }));

  res.json({ success: true, data: ranges });
});


const createVehicle = catchAsync(async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  res.status(201).json(vehicle);
});
const updateVehicle = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Prevent updating _id or other protected fields
  delete updates._id;
  delete updates.__v;
  delete updates.createdAt;

  const vehicle = await Vehicle.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!vehicle) {
    return res.status(404).json({
      message: "Vehicle not found",
    });
  }

  res.json({
    message: "Vehicle updated successfully",
    vehicle,
  });
});
const deleteVehicle = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Block deletion while the vehicle has active or upcoming bookings
  const activeBookings = await Booking.countDocuments({
    vehicle: id,
    status: { $in: ['pending', 'confirmed'] },
    endDate: { $gte: new Date() },
  });

  if (activeBookings > 0) {
    return res.status(409).json({
      success: false,
      message: `Cannot delete: this vehicle has ${activeBookings} active or upcoming booking${activeBookings > 1 ? 's' : ''}. Cancel them first.`,
    });
  }

  const vehicle = await Vehicle.findByIdAndDelete(id);

  if (!vehicle) {
    return res.status(404).json({
      message: "Vehicle not found",
    });
  }

  // Optional: Delete images from Cloudinary if needed
  // if (vehicle.images) {
  //   vehicle.images.forEach((imageUrl) => {
  //     const publicId = imageUrl.split('/').pop().split('.')[0];
  //     cloudinary.uploader.destroy(publicId);
  //   });
  // }

  res.json({
    message: "Vehicle deleted successfully",
    vehicle,
  });
});

module.exports = { getVehicles, getVehicleById, getAvailableVehiclesByDateRange, getBookingDatesForVehicle, createVehicle,deleteVehicle,updateVehicle };