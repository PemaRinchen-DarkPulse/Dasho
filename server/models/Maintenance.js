const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema(
  {
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    type: { type: String, enum: ['preventive', 'corrective', 'calibration', 'upgrade', 'inspection'], default: 'preventive' },
  start: { type: Date },
  end: { type: Date },
    assignee: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
    durationMinutes: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    report: {
      data: Buffer,
      contentType: String,
      filename: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
