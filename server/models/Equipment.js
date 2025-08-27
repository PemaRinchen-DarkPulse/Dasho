const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: String,
    capacity: { type: Number, default: 1 },
    bookingMinutes: { type: Number, default: 30 },
  status: { type: String, enum: ['operational', 'maintenance'], default: 'operational' },
    keyFeatures: [String],
    technicalSpecifications: [
      {
        key: { type: String, required: true },
        value: { type: String, default: '' },
      },
    ],
  usageGuidelines: [String],
  safetyRequirements: [String],
    image: {
      data: Buffer,
      contentType: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', EquipmentSchema);
