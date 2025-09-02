const Maintenance = require('../models/Maintenance');
const Equipment = require('../models/Equipment');

// Transition rules:
// - scheduled -> in-progress when start <= now < end
// - scheduled/in-progress -> completed when end <= now
async function runMaintenanceStatusTick() {
  const now = new Date();
  try {
    // Flip to in-progress when window starts
    const toInProgress = await Maintenance.updateMany(
      { status: 'scheduled', start: { $ne: null, $lte: now }, end: { $ne: null, $gt: now } },
      { $set: { status: 'in-progress' } }
    );

    // Any equipment with an in-progress maintenance should be marked maintenance
    if ((toInProgress.modifiedCount || 0) > 0) {
      const inProg = await Maintenance.find({ status: 'in-progress' }, { equipmentId: 1 }).lean();
      const ids = [...new Set(inProg.map((m) => String(m.equipmentId)))];
      if (ids.length) {
        await Equipment.updateMany({ _id: { $in: ids } }, { $set: { status: 'maintenance' } });
      }
    }

  // Do not auto-complete; completion should be set explicitly to capture real end time
  const toCompleted = { modifiedCount: 0 };

    // For equipment with no remaining in-progress windows, consider flipping back to operational
    if ((toCompleted.modifiedCount || 0) > 0) {
      const stillInProg = await Maintenance.aggregate([
        { $match: { status: 'in-progress' } },
        { $group: { _id: '$equipmentId' } },
      ]);
      const inProgSet = new Set(stillInProg.map((d) => String(d._id)));
      const allEq = await Equipment.find({}, { _id: 1 }).lean();
      const toOperational = allEq
        .map((e) => String(e._id))
        .filter((id) => !inProgSet.has(id));
      if (toOperational.length) {
        await Equipment.updateMany({ _id: { $in: toOperational } }, { $set: { status: 'operational' } });
      }
    }

    return { inProgress: toInProgress.modifiedCount || 0, completed: toCompleted.modifiedCount || 0 };
  } catch (err) {
    console.error('Maintenance status tick error:', err.message);
    return { inProgress: 0, completed: 0, error: err.message };
  }
}

function startMaintenanceStatusScheduler({ intervalMs = 60_000 } = {}) {
  // Run once on startup
  runMaintenanceStatusTick();
  // Then repeat
  const timer = setInterval(runMaintenanceStatusTick, intervalMs);
  return () => clearInterval(timer);
}

module.exports = { startMaintenanceStatusScheduler, runMaintenanceStatusTick };
