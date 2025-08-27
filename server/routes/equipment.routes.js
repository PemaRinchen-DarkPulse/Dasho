const express = require('express');
const multer = require('multer');
const { createEquipment, listEquipment, getEquipmentImage, getEquipmentById } = require('../controllers/equipment.controller');

const router = express.Router();

// Multer config: memory storage to store Buffer into Mongo
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Only JPG/PNG images are allowed'));
  },
});

// POST /api/equipment
router.post('/', upload.single('imageFile'), createEquipment);

// GET /api/equipment
router.get('/', listEquipment);

// GET /api/equipment/:id/image (must be before :id route)
router.get('/:id/image', getEquipmentImage);

// GET /api/equipment/:id
router.get('/:id', getEquipmentById);

module.exports = router;
