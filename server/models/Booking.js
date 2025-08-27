const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm (24h)
    endTime: { type: String, required: true }, // computed and stored
    purpose: { type: String, default: '' },
  reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined', 'cancelled', 'complete'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
