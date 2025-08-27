const { addMinutes, addDays, format, isBefore, isEqual } = require('date-fns');
const Booking = require('../models/Booking');

// Helpers
function toDateTime(dateStr, timeStr) {
  // dateStr: YYYY-MM-DD, timeStr: HH:mm
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

function toTimeStr(dateObj) {
  return format(dateObj, 'HH:mm');
}

function computeEndTime(dateStr, startTime, durationMinutes) {
  const start = toDateTime(dateStr, startTime);
  const end = addMinutes(start, Number(durationMinutes) || 0);
  return { start, end, endTime: toTimeStr(end) };
}

function isConflict(requestedStart, requestedEnd, bookings) {
  // Bookings contain startTime/endTime as HH:mm on the same date
  return bookings.some((b) => {
    const bStart = toDateTime(b.date, b.startTime);
    const bEnd = toDateTime(b.date, b.endTime);
    // overlap if NOT (end <= b.start OR start >= b.end)
    return !(requestedEnd <= bStart || requestedStart >= bEnd);
  });
}

async function findSuggestions({ equipmentId, date, startTime, durationMinutes, stepMinutes = 15, minSuggestions = 5, maxDays = 7 }) {
  const suggestions = [];
  const reqStart = toDateTime(date, startTime);
  const duration = Number(durationMinutes) || 0;

  for (let dayOffset = 0; dayOffset <= maxDays && suggestions.length < minSuggestions; dayOffset++) {
    const dayDateObj = addDays(reqStart, dayOffset);
    const dayStr = format(dayDateObj, 'yyyy-MM-dd');
  const bookingsForDay = await Booking.find({ equipmentId, date: dayStr, status: 'confirmed' }).lean();

    const dayStart = new Date(dayDateObj.getFullYear(), dayDateObj.getMonth(), dayDateObj.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(dayDateObj.getFullYear(), dayDateObj.getMonth(), dayDateObj.getDate(), 23, 59, 0, 0);

    let cursor = dayOffset === 0 ? addMinutes(reqStart, stepMinutes) : dayStart; // start after requested on same day; otherwise from 00:00

    while (suggestions.length < minSuggestions && (isBefore(cursor, dayEnd) || isEqual(cursor, dayEnd))) {
      const cursorEnd = addMinutes(cursor, duration);
      if (cursorEnd > dayEnd) break; // don't spill past day end

      if (!isConflict(cursor, cursorEnd, bookingsForDay)) {
        suggestions.push({ date: dayStr, time: toTimeStr(cursor) });
      }

      cursor = addMinutes(cursor, stepMinutes);
    }
  }

  return suggestions;
}

exports.checkAvailability = async (req, res) => {
  try {
    const { equipmentId, date, time, durationMinutes } = req.body || {};
    if (!equipmentId || !date || !time || typeof durationMinutes === 'undefined') {
      return res.status(400).json({ error: 'equipmentId, date, time, durationMinutes are required' });
    }

    const { start, end } = computeEndTime(date, time, durationMinutes);

  // Fetch confirmed bookings for the same equipment and date (only confirmed block availability)
  const bookings = await Booking.find({ equipmentId, date, status: 'confirmed' }).lean();

  const conflict = isConflict(start, end, bookings);
    if (!conflict) {
      return res.json({ available: true });
    }

  const suggestedSlots = await findSuggestions({ equipmentId, date, startTime: time, durationMinutes, stepMinutes: 15, minSuggestions: 5 });
    return res.json({ available: false, suggestedSlots });
  } catch (err) {
    console.error('checkAvailability error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId; // prefer auth, fallback for tests
    const { equipmentId, date, time, durationMinutes, purpose = '' } = req.body || {};
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!equipmentId || !date || !time || typeof durationMinutes === 'undefined') {
      return res.status(400).json({ error: 'equipmentId, date, time, durationMinutes are required' });
    }

    const { start, end, endTime } = computeEndTime(date, time, durationMinutes);

    // Recheck conflicts
  const bookings = await Booking.find({ equipmentId, date, status: 'confirmed' }).lean();
    const conflict = isConflict(start, end, bookings);
    if (conflict) {
      const suggestedSlots = await findSuggestions({ equipmentId, date, startTime: time, durationMinutes, stepMinutes: 15, minSuggestions: 5 });
      return res.status(409).json({ error: 'Time slot conflicts with existing booking', suggestedSlots });
    }

    const doc = await Booking.create({
      equipmentId,
      userId,
      date,
      startTime: time,
      endTime,
      purpose,
      // status defaults to 'pending' in schema
    });

    return res.status(201).json({ message: 'Booking confirmed', bookingId: doc._id });
  } catch (err) {
    console.error('createBooking error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.listBookings = async (req, res) => {
  try {
    const { status } = req.query || {};
    const filter = {};
    if (status) filter.status = status;

    const items = await Booking.find(filter)
      .populate({ path: 'equipmentId', select: 'name' })
      .populate({ path: 'userId', select: 'email name' })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = items.map((b) => ({
      id: b._id,
      equipmentId: b.equipmentId?._id,
      equipmentName: b.equipmentId?.name || 'Equipment',
      userEmail: b.userId?.email || '',
      userName: b.userId?.name || '',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      purpose: b.purpose || '',
  reason: b.reason || '',
      status: b.status || 'pending',
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('listBookings error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.listConfirmedBookings = async (req, res) => {
  try {
    const items = await Booking.find({ status: 'confirmed' })
      .populate({ path: 'equipmentId', select: 'name' })
      .populate({ path: 'userId', select: 'email name' })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const mapped = items.map((b) => ({
      id: b._id,
      equipmentId: b.equipmentId?._id,
      equipmentName: b.equipmentId?.name || 'Equipment',
      userEmail: b.userId?.email || '',
      userName: b.userId?.name || '',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      purpose: b.purpose || '',
      reason: b.reason || '',
      status: b.status || 'pending',
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('listConfirmedBookings error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
  const { status, reason = '' } = req.body || {};
    const allowed = ['pending', 'confirmed', 'declined', 'cancelled', 'complete'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { status, reason },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('updateBookingStatus error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// List bookings for the authenticated user
exports.listMyBookings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const items = await Booking.find({ userId })
      .populate({ path: 'equipmentId', select: 'name' })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = items.map((b) => ({
      id: b._id,
      equipmentId: b.equipmentId?._id,
      equipmentName: b.equipmentId?.name || 'Equipment',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      purpose: b.purpose || '',
      reason: b.reason || '',
      status: b.status || 'pending',
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('listMyBookings error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
