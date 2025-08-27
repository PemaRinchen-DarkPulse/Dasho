require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') {
	app.use(morgan('dev'));
}

// DB Connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
	console.error('Missing MONGO_URI in environment');
	process.exit(1);
}

mongoose
	.connect(MONGO_URI)
	.then(() => console.log('MongoDB connected'))
	.catch((err) => {
		console.error('MongoDB connection error:', err.message);
		process.exit(1);
	});

// Routes
const authRoutes = require('./routes/auth.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const { authMiddleware } = require('./middleware/auth.middleware');
const bookingRoutes = require('./routes/booking.routes');

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);

// Protected example routes for frontend guards
app.get('/api/protected/equipment', authMiddleware, (req, res) => {
	return res.json({ ok: true, message: 'Authorized for equipment', user: req.user });
});

app.get('/api/protected/admin-dashboard', authMiddleware, (req, res) => {
	if (req.user.role !== 'admin') {
		return res.status(403).json({ ok: false, error: 'Forbidden: Admins only' });
	}
	return res.json({ ok: true, message: 'Authorized for admin dashboard', user: req.user });
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

// 404 handler
app.use((req, res) => {
	res.status(404).json({ ok: false, error: 'Route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err);
	res.status(err.status || 500).json({ ok: false, error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

