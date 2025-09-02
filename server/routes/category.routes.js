const express = require('express');
const { listCategories, createCategory } = require('../controllers/category.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public: list categories
router.get('/', listCategories);

// Admin: create category
router.post('/', authMiddleware, requireAdmin, createCategory);

module.exports = router;
