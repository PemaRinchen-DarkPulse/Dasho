const Maintenance = require('../models/Maintenance');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

// Utility to detect overlap between [aStart, aEnd) and [bStart, bEnd)
const overlaps = (aStart, aEnd, bStart, bEnd) => !(aEnd <= bStart || aStart >= bEnd);

exports.createMaintenance = async (req, res) => {
  try {
    const { equipmentId, type = 'preventive', start, end, assignee = '', notes = '' } = req.body || {};
    if (!equipmentId) {
      return res.status(400).json({ error: 'equipmentId is required' });
    }

  // Corrective maintenance: immediate; set start to now and status to in-progress
    if (String(type).toLowerCase() === 'corrective') {
      // Create maintenance as in-progress now
      const doc = await Maintenance.create({
        equipmentId,
        type: 'corrective',
    status: 'in-progress',
    start: new Date(),
        assignee,
        notes,
      });

      // Update equipment status to maintenance
      await Equipment.findByIdAndUpdate(equipmentId, { $set: { status: 'maintenance' } });
      return res.status(201).json({ ok: true, id: doc._id });
    }

    // Scheduled types require start/end
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end are required for scheduled maintenance' });
    }
    const startDt = new Date(start);
    const endDt = new Date(end);
    if (!(startDt instanceof Date) || isNaN(startDt) || !(endDt instanceof Date) || isNaN(endDt) || endDt <= startDt) {
      return res.status(400).json({ error: 'Invalid start or end datetime' });
    }

    // Check conflicts with existing maintenance for same equipment
    const existingMaint = await Maintenance.find({ equipmentId }).lean();
    const mConflict = existingMaint.some((m) => {
      if (!m.start || !m.end) return false;
      return overlaps(startDt, endDt, new Date(m.start), new Date(m.end)) && m.status !== 'cancelled';
    });
    if (mConflict) {
      return res.status(409).json({ error: 'Overlaps with existing maintenance window' });
    }

    // Block creation if confirmed bookings overlap
    const confirmedBookings = await Booking.find({ equipmentId, status: 'confirmed' }).lean();
    const bConflict = confirmedBookings.some((b) => {
      const bStart = new Date(`${b.date}T${b.startTime}:00`);
      const bEnd = new Date(`${b.date}T${b.endTime}:00`);
      return overlaps(startDt, endDt, bStart, bEnd);
    });
    if (bConflict) {
      return res.status(409).json({ error: 'Overlaps with confirmed bookings. Resolve bookings first.' });
    }

  // Default to scheduled on creation; scheduler will flip to in-progress at start time
  const initialStatus = 'scheduled';
  const doc = await Maintenance.create({ equipmentId, type, start: startDt, end: endDt, assignee, notes, status: initialStatus });
    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('createMaintenance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.listByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const items = await Maintenance.find({ equipmentId }).sort({ start: -1 }).lean();
    return res.json(items);
  } catch (err) {
    console.error('listByEquipment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
  const { status } = req.body || {};
    const allowed = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const doc = await Maintenance.findById(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const wasStatus = doc.status;
    doc.status = status;
    if (status === 'completed') {
      // Set end to the moment of completion; used to compute duration
      doc.end = new Date();
    }
    await doc.save();

    // Sync equipment status
    const eqId = doc.equipmentId;
  if (status === 'in-progress') {
      await Equipment.findByIdAndUpdate(eqId, { $set: { status: 'maintenance' } });
    } else {
      const anyInProg = await Maintenance.exists({ equipmentId: eqId, status: 'in-progress' });
      if (!anyInProg) {
        await Equipment.findByIdAndUpdate(eqId, { $set: { status: 'operational' } });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Update maintenance details (duration, cost, status, notes, and optionally equipment status)
exports.updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationMinutes, cost, status, notes, setEquipmentOperational } = req.body || {};
    const doc = await Maintenance.findById(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    if (durationMinutes != null) doc.durationMinutes = Number(durationMinutes) || 0;
    if (cost != null) doc.cost = Number(cost) || 0;
    if (typeof notes === 'string') doc.notes = notes;
    if (status && ['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      doc.status = status;
      if (status === 'completed') {
        doc.end = new Date();
      }
    }
    await doc.save();

    // Optionally change equipment status back to operational
    if (setEquipmentOperational) {
      await Equipment.findByIdAndUpdate(doc.equipmentId, { $set: { status: 'operational' } });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('updateMaintenance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Upload a PDF report
exports.uploadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF allowed' });

    const doc = await Maintenance.findById(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    doc.report = { data: file.buffer, contentType: file.mimetype, filename: file.originalname };
    await doc.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error('uploadReport error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Download report
exports.downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Maintenance.findById(id, { report: 1 });
    if (!doc || !doc.report || !doc.report.data) return res.status(404).json({ error: 'Report not found' });
    res.setHeader('Content-Type', doc.report.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.report.filename || 'report.pdf'}"`);
    return res.send(doc.report.data);
  } catch (err) {
    console.error('downloadReport error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
