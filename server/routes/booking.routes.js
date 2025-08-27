const express = require('express');
const { checkAvailability, createBooking, listBookings, listConfirmedBookings, updateBookingStatus, listMyBookings } = require('../controllers/booking.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/bookings/availability
router.post('/availability', checkAvailability);

// POST /api/bookings (protected)
router.post('/', authMiddleware, createBooking);

// GET /api/bookings (admin): list all bookings with equipment and user (supports ?status=...)
router.get('/', authMiddleware, requireAdmin, listBookings);

// GET /api/bookings/confirmed: list confirmed bookings (public)
router.get('/confirmed', listConfirmedBookings);

// GET /api/bookings/mine (protected): list current user's bookings
router.get('/mine', authMiddleware, listMyBookings);

// PATCH /api/bookings/:id/status (admin): update status
router.patch('/:id/status', authMiddleware, requireAdmin, updateBookingStatus);

module.exports = router;
