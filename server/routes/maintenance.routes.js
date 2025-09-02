const express = require('express');
const multer = require('multer');
const { createMaintenance, listByEquipment, updateStatus, updateMaintenance, uploadReport, downloadReport } = require('../controllers/maintenance.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/maintenance -> create maintenance (admin only)
router.post('/', authMiddleware, requireAdmin, createMaintenance);

// GET /api/maintenance/:equipmentId -> list maintenance entries for one equipment (public)
router.get('/:equipmentId', listByEquipment);

// PATCH /api/maintenance/:id/status -> admin updates status
router.patch('/:id/status', authMiddleware, requireAdmin, updateStatus);

// PATCH /api/maintenance/:id -> admin updates details (duration, cost, notes, status)
router.patch('/:id', authMiddleware, requireAdmin, updateMaintenance);

// POST /api/maintenance/:id/report -> upload PDF report
router.post('/:id/report', authMiddleware, requireAdmin, upload.single('file'), uploadReport);

// GET /api/maintenance/:id/report -> download PDF report (admin only for now)
router.get('/:id/report', authMiddleware, requireAdmin, downloadReport);

module.exports = router;
