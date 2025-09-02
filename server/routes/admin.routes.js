const express = require('express');
const { getStats } = require('../controllers/admin.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/admin/stats -> dashboard KPIs
router.get('/stats', authMiddleware, requireAdmin, getStats);

module.exports = router;
