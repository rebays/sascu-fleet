const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  type: { type: String, enum: ['car', 'bike', 'scooter', 'truck', 'suv', 'bus'], required: true },
  licensePlate: { type: String, required: true, unique: true },
  // Hourly rates are legacy — kept for existing data/API consumers, but the
  // admin dashboard no longer sets them; new vehicles default to 0.
  pricePerHour: { type: Number, default: 0 },
  pricePerHourMember: { type: Number, default: 0 },   // 0 = fallback to regular price
  // In-town day/half-day rates (pricePerDay/pricePerDayMember predate the
  // in-town/out-of-town split and remain the "in-town" rate for backward compatibility).
  pricePerDay: { type: Number, required: true },
  pricePerDayMember: { type: Number, default: 0 },
  pricePerHalfDay: { type: Number, default: 0 },
  pricePerHalfDayMember: { type: Number, default: 0 },
  // Out-of-town day/half-day rates
  pricePerDayOutOfTown: { type: Number, default: 0 },
  pricePerDayMemberOutOfTown: { type: Number, default: 0 },
  pricePerHalfDayOutOfTown: { type: Number, default: 0 },
  pricePerHalfDayMemberOutOfTown: { type: Number, default: 0 },
  location: { type: String, required: true },
  images: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);