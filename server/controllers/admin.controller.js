const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const User = require('../models/User');

function toDateTime(dateStr, timeStr) {
  // dateStr: YYYY-MM-DD, timeStr: HH:mm
  return new Date(`${dateStr}T${timeStr}:00`);
}

// GET /api/admin/stats
// Returns dashboard metrics derived from DB
exports.getStats = async (_req, res) => {
  try {
    const periodDays = Number(process.env.UTILIZATION_DAYS || 7);
    const dailyMinutes = Number(process.env.OPERATIONAL_MINUTES_PER_DAY || 12 * 60); // default 12h/day
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Fetch required data in parallel
    const [equipmentCount, userCount, bookings, equipments] = await Promise.all([
      Equipment.countDocuments(),
      User.countDocuments(),
      Booking.find({ status: 'confirmed' }).select('date startTime endTime equipmentId').lean(),
      Equipment.find({}).select('quantity capacity').lean(),
    ]);

    // Active bookings: confirmed whose end is in the future
    const activeBookings = (bookings || []).filter((b) => {
      const end = toDateTime(b.date, b.endTime);
      return end > now;
    }).length;

    // Utilization: total minutes booked in the last N days / total capacity minutes
    const bookedMinutes = (bookings || []).reduce((acc, b) => {
      const s = toDateTime(b.date, b.startTime);
      const e = toDateTime(b.date, b.endTime);
      // Only count overlap with [periodStart, now]
      if (e < periodStart || s > now) return acc;
      const from = s < periodStart ? periodStart : s;
      const to = e > now ? now : e;
      const mins = Math.max(0, Math.round((to - from) / 60000));
      return acc + mins;
    }, 0);

    // Total concurrent capacity across all equipment
    const totalConcurrent = (equipments || []).reduce((acc, e) => {
      const units = Math.max(1, Number(e.quantity || 1));
      const capacity = Math.max(1, Number(e.capacity || 1));
      return acc + units * capacity;
    }, 0);
    const totalCapacityMinutes = totalConcurrent * dailyMinutes * periodDays;
    const utilizationRate = totalCapacityMinutes > 0
      ? Math.min(100, Math.round((bookedMinutes / totalCapacityMinutes) * 100))
      : 0;

    return res.json({
      equipmentCount,
      userCount,
      activeBookings,
      utilizationRate,
      window: { days: periodDays, dailyMinutes },
    });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
