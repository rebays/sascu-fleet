const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  bookingRef: {type: String,unique: true,sparse: true},
  deposit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  driversLicense: { type: String },
  pickupLocation: { type: String },
  note: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  payments: [
  {
    amount: { type: Number, required: true },
    method: { type: String, default: 'manual' },
    note: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }
  ],
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  statusHistory: [
  {
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: String // optional note, e.g. "Approved by John"
  }
],
}, { timestamps: true });


bookingSchema.pre('save', async function(next) {
  if (!this.bookingRef) {
    // Generate like: BOOK-20251208-001
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    let count = await this.constructor.countDocuments({
      bookingRef: new RegExp(`^BOOK-${date}`)
    });
    count++;
    this.bookingRef = `BOOK-${date}-${String(count).padStart(3,'0')}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);