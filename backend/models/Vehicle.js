const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  type: { type: String, enum: ['car', 'bike', 'scooter', 'truck'], required: true },
  licensePlate: { type: String, required: true, unique: true },
  pricePerHour: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  pricePerHourMember: { type: Number, default: 0 },   // 0 = fallback to regular price
  pricePerDayMember: { type: Number, default: 0 },
  location: { type: String, required: true },
  images: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);